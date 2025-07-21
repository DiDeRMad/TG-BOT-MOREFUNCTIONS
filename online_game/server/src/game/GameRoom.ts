import { WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { Player } from './Player';

export class GameRoom {
  private players: Map<string, Player> = new Map();

  addPlayer(socket: WebSocket): Player {
    const id = uuidv4();
    const player = new Player(id, socket);
    this.players.set(id, player);

    socket.send(JSON.stringify({ type: 'welcome', id }));
    this.broadcastSystem(`${id} joined the room`);

    return player;
  }

  removePlayer(player: Player) {
    this.players.delete(player.id);
    this.broadcastSystem(`${player.id} left the room`);
  }

  handlePlayerMessage(player: Player, raw: string) {
    let msg: any;
    try {
      msg = JSON.parse(raw);
    } catch {
      // If not JSON, treat it as plain text
      msg = { text: raw };
    }

    // Chat
    if (typeof msg.text === 'string') {
      this.broadcast({ type: 'chat', from: player.id, text: msg.text });
    }

    // Movement command { type: 'move', dir: 'up'|'down'|'left'|'right', pressed: true|false }
    if (msg.type === 'move' && typeof msg.dir === 'string' && typeof msg.pressed === 'boolean') {
      switch (msg.dir) {
        case 'up':
          player.moveUp = msg.pressed;
          break;
        case 'down':
          player.moveDown = msg.pressed;
          break;
        case 'left':
          player.moveLeft = msg.pressed;
          break;
        case 'right':
          player.moveRight = msg.pressed;
          break;
      }
    }
  }

  /** Game loop at ~20 Hz */
  private interval = setInterval(() => {
    this.tick();
  }, 50);

  private tick() {
    // Update players positions
    for (const p of this.players.values()) {
      p.updatePosition();
    }

    // Broadcast state to all players
    const snapshot = Array.from(this.players.values()).map((p) => ({
      id: p.id,
      x: Math.round(p.x),
      y: Math.round(p.y),
    }));
    this.broadcast({ type: 'state', players: snapshot });
  }
  private broadcast(obj: any) {
    const data = JSON.stringify(obj);
    for (const p of this.players.values()) {
      p.socket.send(data);
    }
  }

  private broadcastSystem(text: string) {
    this.broadcast({ type: 'system', text });
  }
}