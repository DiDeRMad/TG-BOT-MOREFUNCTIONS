import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import Character from '@/models/Character';
import ChatMessage from '@/models/ChatMessage';
import Battle from '@/models/Battle';
import Guild from '@/models/Guild';
import { logger } from '@/utils/logger';
import { redisUtils } from '@/config/redis';
import { ISocketUser } from '@/types';

interface AuthenticatedSocket extends Socket {
  user?: any;
  character?: any;
}

// Store active connections
const activeUsers = new Map<string, ISocketUser>();
const activeRooms = new Map<string, Set<string>>();

export const setupSocketHandlers = (io: Server) => {
  // Authentication middleware
  io.use(async (socket: any, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      // Check if token is blacklisted
      const isBlacklisted = await redisUtils.get(`blacklist:${token}`);
      if (isBlacklisted) {
        return next(new Error('Token is blacklisted'));
      }

      // Get user from database
      const user = await User.findById(decoded.userId).select('-password');
      if (!user || !user.verified) {
        return next(new Error('User not found or not verified'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const user = socket.user;
    logger.info(`Пользователь подключился: ${user.username} (${socket.id})`);

    // Add user to active users
    activeUsers.set(socket.id, {
      userId: user._id.toString(),
      username: user.username,
      room: undefined
    });

    // Update user online status
    updateUserOnlineStatus(user._id.toString(), true);

    // Send welcome message
    socket.emit('connected', {
      message: `Добро пожаловать, ${user.username}!`,
      onlineUsers: Array.from(activeUsers.values()).length
    });

    // Broadcast user joined to all users
    socket.broadcast.emit('user_joined', {
      username: user.username,
      onlineUsers: Array.from(activeUsers.values()).length
    });

    // Character selection
    socket.on('select_character', async (data: { characterId: string }) => {
      try {
        const character = await Character.findOne({
          _id: data.characterId,
          userId: user._id
        });

        if (!character) {
          socket.emit('error', { message: 'Персонаж не найден' });
          return;
        }

        socket.character = character;
        
        // Update active user info
        const activeUser = activeUsers.get(socket.id);
        if (activeUser) {
          activeUser.characterId = character._id.toString();
          activeUser.location = character.location;
        }

        // Join location room
        const locationRoom = `${character.location.world}_${character.location.zone}`;
        socket.join(locationRoom);
        
        // Update room tracking
        if (!activeRooms.has(locationRoom)) {
          activeRooms.set(locationRoom, new Set());
        }
        activeRooms.get(locationRoom)!.add(socket.id);

        socket.emit('character_selected', character);
        
        // Notify others in the same location
        socket.to(locationRoom).emit('player_entered', {
          character: {
            _id: character._id,
            name: character.name,
            level: character.level,
            class: character.class
          }
        });

        logger.info(`${user.username} выбрал персонажа: ${character.name}`);
      } catch (error) {
        logger.error('Ошибка выбора персонажа:', error);
        socket.emit('error', { message: 'Ошибка выбора персонажа' });
      }
    });

    // Chat system
    socket.on('send_message', async (data: {
      channel: string;
      message: string;
      recipientId?: string;
      guildId?: string;
    }) => {
      try {
        if (!socket.character) {
          socket.emit('error', { message: 'Выберите персонажа' });
          return;
        }

        // Validate message
        if (!data.message || data.message.trim().length === 0) {
          socket.emit('error', { message: 'Сообщение не может быть пустым' });
          return;
        }

        if (data.message.length > 500) {
          socket.emit('error', { message: 'Сообщение слишком длинное' });
          return;
        }

        // Create message
        const messageData: any = {
          senderId: user._id,
          channel: data.channel,
          message: data.message.trim()
        };

        if (data.recipientId) {
          messageData.recipientId = data.recipientId;
        }

        if (data.guildId) {
          messageData.guildId = data.guildId;
        }

        const chatMessage = await ChatMessage.create(messageData);
        await chatMessage.populate('senderId', 'username avatar role');

        // Emit message based on channel
        switch (data.channel) {
          case 'global':
            io.emit('new_message', chatMessage);
            break;
            
          case 'guild':
            if (socket.character.guildId) {
              io.to(`guild_${socket.character.guildId}`).emit('new_message', chatMessage);
            }
            break;
            
          case 'whisper':
            if (data.recipientId) {
              // Send to recipient and sender
              const recipientSocket = findSocketByUserId(data.recipientId);
              if (recipientSocket) {
                recipientSocket.emit('new_message', chatMessage);
              }
              socket.emit('new_message', chatMessage);
            }
            break;
            
          case 'trade':
            io.emit('new_message', chatMessage);
            break;
            
          case 'help':
            io.emit('new_message', chatMessage);
            break;
            
          default:
            // Location-based chat
            const locationRoom = `${socket.character.location.world}_${socket.character.location.zone}`;
            io.to(locationRoom).emit('new_message', chatMessage);
        }

        logger.info(`Сообщение в чате ${data.channel}: ${user.username} -> ${data.message}`);
      } catch (error) {
        logger.error('Ошибка отправки сообщения:', error);
        socket.emit('error', { message: 'Ошибка отправки сообщения' });
      }
    });

    // Movement system
    socket.on('move_character', async (data: {
      world: string;
      zone: string;
      x: number;
      y: number;
    }) => {
      try {
        if (!socket.character) {
          socket.emit('error', { message: 'Выберите персонажа' });
          return;
        }

        const oldLocationRoom = `${socket.character.location.world}_${socket.character.location.zone}`;
        const newLocationRoom = `${data.world}_${data.zone}`;

        // Update character location
        socket.character.location = {
          world: data.world,
          zone: data.zone,
          x: data.x,
          y: data.y
        };

        await Character.findByIdAndUpdate(socket.character._id, {
          location: socket.character.location
        });

        // Update active user location
        const activeUser = activeUsers.get(socket.id);
        if (activeUser) {
          activeUser.location = socket.character.location;
        }

        // Leave old room and join new room
        if (oldLocationRoom !== newLocationRoom) {
          socket.leave(oldLocationRoom);
          socket.join(newLocationRoom);

          // Update room tracking
          activeRooms.get(oldLocationRoom)?.delete(socket.id);
          if (!activeRooms.has(newLocationRoom)) {
            activeRooms.set(newLocationRoom, new Set());
          }
          activeRooms.get(newLocationRoom)!.add(socket.id);

          // Notify old location about player leaving
          socket.to(oldLocationRoom).emit('player_left', {
            characterId: socket.character._id
          });

          // Notify new location about player entering
          socket.to(newLocationRoom).emit('player_entered', {
            character: {
              _id: socket.character._id,
              name: socket.character.name,
              level: socket.character.level,
              class: socket.character.class,
              location: socket.character.location
            }
          });
        } else {
          // Just update position in same location
          socket.to(newLocationRoom).emit('player_moved', {
            characterId: socket.character._id,
            location: socket.character.location
          });
        }

        socket.emit('movement_confirmed', {
          location: socket.character.location
        });

      } catch (error) {
        logger.error('Ошибка перемещения персонажа:', error);
        socket.emit('error', { message: 'Ошибка перемещения' });
      }
    });

    // Battle system
    socket.on('challenge_player', async (data: { targetCharacterId: string }) => {
      try {
        if (!socket.character) {
          socket.emit('error', { message: 'Выберите персонажа' });
          return;
        }

        const targetCharacter = await Character.findById(data.targetCharacterId);
        if (!targetCharacter) {
          socket.emit('error', { message: 'Цель не найдена' });
          return;
        }

        // Create battle
        const battle = await Battle.createPvPBattle(
          socket.character._id.toString(),
          targetCharacter._id.toString()
        );

        // Notify both players
        const targetSocket = findSocketByCharacterId(targetCharacter._id.toString());
        if (targetSocket) {
          targetSocket.emit('battle_challenge', {
            battleId: battle._id,
            challenger: {
              name: socket.character.name,
              level: socket.character.level,
              class: socket.character.class
            }
          });
        }

        socket.emit('challenge_sent', {
          battleId: battle._id,
          target: {
            name: targetCharacter.name,
            level: targetCharacter.level,
            class: targetCharacter.class
          }
        });

        logger.info(`PvP вызов: ${socket.character.name} -> ${targetCharacter.name}`);
      } catch (error) {
        logger.error('Ошибка вызова на бой:', error);
        socket.emit('error', { message: 'Ошибка вызова на бой' });
      }
    });

    socket.on('accept_battle', async (data: { battleId: string }) => {
      try {
        const battle = await Battle.findById(data.battleId);
        if (!battle || battle.status !== 'waiting') {
          socket.emit('error', { message: 'Битва не найдена или уже началась' });
          return;
        }

        // Start battle
        await battle.start();

        // Join battle room
        const battleRoom = `battle_${battle._id}`;
        socket.join(battleRoom);

        // Notify all participants
        io.to(battleRoom).emit('battle_started', {
          battleId: battle._id,
          participants: battle.participants
        });

        logger.info(`Битва началась: ${battle._id}`);
      } catch (error) {
        logger.error('Ошибка принятия боя:', error);
        socket.emit('error', { message: 'Ошибка принятия боя' });
      }
    });

    socket.on('battle_action', async (data: {
      battleId: string;
      type: string;
      targetId?: string;
      skillId?: string;
      itemId?: string;
    }) => {
      try {
        if (!socket.character) {
          socket.emit('error', { message: 'Выберите персонажа' });
          return;
        }

        const battle = await Battle.findById(data.battleId);
        if (!battle || battle.status !== 'active') {
          socket.emit('error', { message: 'Битва не найдена или не активна' });
          return;
        }

        // Add action to battle
        await battle.addAction(socket.character._id.toString(), {
          type: data.type,
          targetId: data.targetId,
          skillId: data.skillId,
          itemId: data.itemId
        });

        // Check if all players have submitted actions
        const aliveParticipants = battle.participants.filter(p => p.status === 'alive');
        const actionsThisRound = aliveParticipants.filter(p => 
          p.actions.length > battle.rounds.length
        );

        if (actionsThisRound.length === aliveParticipants.length) {
          // Process round
          await battle.processRound();
          
          // Emit round results
          const battleRoom = `battle_${battle._id}`;
          io.to(battleRoom).emit('round_processed', {
            round: battle.rounds[battle.rounds.length - 1],
            participants: battle.participants,
            status: battle.status
          });

          if (battle.status === 'completed') {
            io.to(battleRoom).emit('battle_ended', {
              winner: battle.winner,
              rewards: battle.rewards
            });
          }
        }

      } catch (error) {
        logger.error('Ошибка действия в бою:', error);
        socket.emit('error', { message: 'Ошибка действия в бою' });
      }
    });

    // Guild system
    socket.on('join_guild_channel', async (data: { guildId: string }) => {
      try {
        const guild = await Guild.findById(data.guildId);
        if (!guild) {
          socket.emit('error', { message: 'Гильдия не найдена' });
          return;
        }

        const isMember = guild.members.some(member => 
          member.userId.toString() === user._id.toString()
        );

        if (!isMember) {
          socket.emit('error', { message: 'Вы не являетесь членом этой гильдии' });
          return;
        }

        socket.join(`guild_${guild._id}`);
        socket.emit('guild_channel_joined', { guildId: guild._id });
      } catch (error) {
        logger.error('Ошибка подключения к каналу гильдии:', error);
        socket.emit('error', { message: 'Ошибка подключения к каналу гильдии' });
      }
    });

    // Trading system
    socket.on('trade_request', async (data: { targetCharacterId: string }) => {
      try {
        if (!socket.character) {
          socket.emit('error', { message: 'Выберите персонажа' });
          return;
        }

        const targetSocket = findSocketByCharacterId(data.targetCharacterId);
        if (!targetSocket) {
          socket.emit('error', { message: 'Игрок не в сети' });
          return;
        }

        targetSocket.emit('trade_request', {
          from: {
            characterId: socket.character._id,
            name: socket.character.name,
            level: socket.character.level
          }
        });

        socket.emit('trade_request_sent');
      } catch (error) {
        logger.error('Ошибка запроса обмена:', error);
        socket.emit('error', { message: 'Ошибка запроса обмена' });
      }
    });

    // Ping/Pong for connection health
    socket.on('ping', () => {
      socket.emit('pong');
    });

    // Disconnect handler
    socket.on('disconnect', (reason) => {
      logger.info(`Пользователь отключился: ${user.username} (${socket.id}) - ${reason}`);
      
      // Remove from active users
      activeUsers.delete(socket.id);
      
      // Remove from rooms
      activeRooms.forEach((sockets, room) => {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            activeRooms.delete(room);
          }
        }
      });

      // Update user offline status
      updateUserOnlineStatus(user._id.toString(), false);

      // Notify others
      socket.broadcast.emit('user_left', {
        username: user.username,
        onlineUsers: Array.from(activeUsers.values()).length
      });

      if (socket.character) {
        const locationRoom = `${socket.character.location.world}_${socket.character.location.zone}`;
        socket.to(locationRoom).emit('player_left', {
          characterId: socket.character._id
        });
      }
    });
  });

  // Helper functions
  function findSocketByUserId(userId: string): AuthenticatedSocket | null {
    for (const [socketId, user] of activeUsers.entries()) {
      if (user.userId === userId) {
        return io.sockets.sockets.get(socketId) as AuthenticatedSocket;
      }
    }
    return null;
  }

  function findSocketByCharacterId(characterId: string): AuthenticatedSocket | null {
    for (const [socketId, user] of activeUsers.entries()) {
      if (user.characterId === characterId) {
        return io.sockets.sockets.get(socketId) as AuthenticatedSocket;
      }
    }
    return null;
  }

  async function updateUserOnlineStatus(userId: string, isOnline: boolean) {
    try {
      await User.findByIdAndUpdate(userId, {
        isOnline,
        lastSeen: new Date()
      });

      if (isOnline) {
        await redisUtils.setWithExpiry(`user_online:${userId}`, 'true', 300);
      } else {
        await redisUtils.del(`user_online:${userId}`);
      }
    } catch (error) {
      logger.error('Ошибка обновления статуса пользователя:', error);
    }
  }

  // Periodic cleanup
  setInterval(() => {
    // Clean up empty rooms
    activeRooms.forEach((sockets, room) => {
      if (sockets.size === 0) {
        activeRooms.delete(room);
      }
    });
  }, 60000); // Every minute

  logger.info('🔗 Socket.IO обработчики настроены');
};