import mongoose, { Schema } from 'mongoose';
import { IBattle, BattleType, BattleStatus } from '@/types';

const battleActionSchema = new Schema({
  characterId: {
    type: Schema.Types.ObjectId,
    ref: 'Character',
    required: true
  },
  type: {
    type: String,
    enum: ['attack', 'skill', 'item', 'defend', 'flee'],
    required: true
  },
  targetId: {
    type: Schema.Types.ObjectId,
    ref: 'Character',
    default: null
  },
  skillId: {
    type: String,
    default: null
  },
  itemId: {
    type: Schema.Types.ObjectId,
    ref: 'Item',
    default: null
  },
  damage: {
    type: Number,
    default: 0
  },
  healing: {
    type: Number,
    default: 0
  },
  effects: [{
    type: String
  }],
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const battleParticipantSchema = new Schema({
  characterId: {
    type: Schema.Types.ObjectId,
    ref: 'Character',
    required: true
  },
  team: {
    type: Number,
    required: true,
    min: 1,
    max: 2
  },
  health: {
    type: Number,
    required: true,
    min: 0
  },
  mana: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['alive', 'dead', 'fled'],
    default: 'alive'
  },
  actions: [battleActionSchema]
}, { _id: false });

const battleRoundSchema = new Schema({
  roundNumber: {
    type: Number,
    required: true,
    min: 1
  },
  actions: [battleActionSchema],
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const battleRewardSchema = new Schema({
  characterId: {
    type: Schema.Types.ObjectId,
    ref: 'Character',
    required: true
  },
  experience: {
    type: Number,
    default: 0,
    min: 0
  },
  gold: {
    type: Number,
    default: 0,
    min: 0
  },
  items: [{
    itemId: {
      type: Schema.Types.ObjectId,
      ref: 'Item',
      required: true
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    }
  }]
}, { _id: false });

const battleSchema = new Schema<IBattle>({
  type: {
    type: String,
    enum: ['pve', 'pvp', 'guild_war', 'tournament', 'boss_raid'],
    required: true
  },
  participants: {
    type: [battleParticipantSchema],
    required: true,
    validate: {
      validator: function(participants: any[]) {
        return participants.length >= 1 && participants.length <= 10;
      },
      message: 'Количество участников должно быть от 1 до 10'
    }
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed', 'cancelled'],
    default: 'waiting'
  },
  rounds: [battleRoundSchema],
  winner: {
    type: Schema.Types.ObjectId,
    ref: 'Character',
    default: null
  },
  rewards: [battleRewardSchema],
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for performance
battleSchema.index({ status: 1, type: 1 });
battleSchema.index({ 'participants.characterId': 1 });
battleSchema.index({ startedAt: -1 });

// Get participant by character ID
battleSchema.methods.getParticipant = function(characterId: string) {
  return this.participants.find(p => p.characterId.toString() === characterId);
};

// Check if battle can start
battleSchema.methods.canStart = function() {
  if (this.status !== 'waiting') {
    return false;
  }
  
  // For PvP, need at least 2 participants
  if (this.type === 'pvp' && this.participants.length < 2) {
    return false;
  }
  
  return true;
};

// Start battle
battleSchema.methods.start = function() {
  if (!this.canStart()) {
    throw new Error('Битва не может быть начата');
  }
  
  this.status = 'active';
  this.startedAt = new Date();
  
  return this.save();
};

// Add action to battle
battleSchema.methods.addAction = function(characterId: string, action: any) {
  const participant = this.getParticipant(characterId);
  
  if (!participant) {
    throw new Error('Участник не найден в битве');
  }
  
  if (participant.status !== 'alive') {
    throw new Error('Участник не может выполнить действие');
  }
  
  if (this.status !== 'active') {
    throw new Error('Битва неактивна');
  }
  
  // Add action to participant
  participant.actions.push({
    ...action,
    characterId,
    timestamp: new Date()
  });
  
  return this.save();
};

// Process round
battleSchema.methods.processRound = function() {
  if (this.status !== 'active') {
    throw new Error('Битва неактивна');
  }
  
  const currentRound = this.rounds.length + 1;
  const roundActions: any[] = [];
  
  // Collect all actions from participants
  this.participants.forEach(participant => {
    if (participant.status === 'alive' && participant.actions.length > 0) {
      const action = participant.actions[participant.actions.length - 1];
      roundActions.push(action);
    }
  });
  
  // Sort actions by speed/dexterity (implement later)
  roundActions.sort((a, b) => Math.random() - 0.5);
  
  // Process each action
  roundActions.forEach(action => {
    this.processAction(action);
  });
  
  // Add round to battle
  this.rounds.push({
    roundNumber: currentRound,
    actions: roundActions,
    timestamp: new Date()
  });
  
  // Check if battle is over
  this.checkBattleEnd();
  
  return this.save();
};

// Process individual action
battleSchema.methods.processAction = function(action: any) {
  const attacker = this.getParticipant(action.characterId);
  if (!attacker || attacker.status !== 'alive') return;
  
  switch (action.type) {
    case 'attack':
      this.processAttack(action);
      break;
    case 'skill':
      this.processSkill(action);
      break;
    case 'item':
      this.processItem(action);
      break;
    case 'defend':
      this.processDefend(action);
      break;
    case 'flee':
      this.processFlee(action);
      break;
  }
};

// Process attack action
battleSchema.methods.processAttack = function(action: any) {
  const attacker = this.getParticipant(action.characterId);
  const target = this.getParticipant(action.targetId);
  
  if (!attacker || !target || target.status !== 'alive') return;
  
  // Calculate damage (simplified)
  const baseDamage = Math.floor(Math.random() * 50) + 25;
  const damage = Math.max(1, baseDamage);
  
  // Apply damage
  target.health = Math.max(0, target.health - damage);
  action.damage = damage;
  
  // Check if target died
  if (target.health === 0) {
    target.status = 'dead';
  }
};

// Process skill action
battleSchema.methods.processSkill = function(action: any) {
  const attacker = this.getParticipant(action.characterId);
  if (!attacker || attacker.status !== 'alive') return;
  
  // Simplified skill processing
  // In a real implementation, you would look up the skill and apply its effects
  const manaCost = 20;
  if (attacker.mana >= manaCost) {
    attacker.mana -= manaCost;
    
    if (action.targetId) {
      const target = this.getParticipant(action.targetId);
      if (target && target.status === 'alive') {
        const damage = Math.floor(Math.random() * 75) + 50;
        target.health = Math.max(0, target.health - damage);
        action.damage = damage;
        
        if (target.health === 0) {
          target.status = 'dead';
        }
      }
    }
  }
};

// Process item action
battleSchema.methods.processItem = function(action: any) {
  const user = this.getParticipant(action.characterId);
  if (!user || user.status !== 'alive') return;
  
  // Simplified item processing (healing potion example)
  const healing = Math.floor(Math.random() * 50) + 25;
  user.health = Math.min(user.health + healing, 1000); // Assume max health of 1000
  action.healing = healing;
};

// Process defend action
battleSchema.methods.processDefend = function(action: any) {
  // Defending reduces incoming damage for this round
  // This would be implemented in the damage calculation
  action.effects = ['defending'];
};

// Process flee action
battleSchema.methods.processFlee = function(action: any) {
  const participant = this.getParticipant(action.characterId);
  if (!participant) return;
  
  // 70% chance to flee successfully
  if (Math.random() < 0.7) {
    participant.status = 'fled';
    action.effects = ['fled'];
  } else {
    action.effects = ['flee_failed'];
  }
};

// Check if battle has ended
battleSchema.methods.checkBattleEnd = function() {
  const aliveParticipants = this.participants.filter(p => p.status === 'alive');
  
  if (aliveParticipants.length <= 1) {
    this.status = 'completed';
    this.endedAt = new Date();
    
    // Determine winner
    if (aliveParticipants.length === 1) {
      this.winner = aliveParticipants[0].characterId;
    }
    
    // Award rewards
    this.awardRewards();
  }
};

// Award battle rewards
battleSchema.methods.awardRewards = async function() {
  const Character = mongoose.model('Character');
  
  for (const participant of this.participants) {
    const character = await Character.findById(participant.characterId);
    if (!character) continue;
    
    let expReward = 0;
    let goldReward = 0;
    
    if (participant.status === 'alive' || participant.characterId.toString() === this.winner?.toString()) {
      // Winner gets full rewards
      expReward = 100;
      goldReward = 50;
    } else if (participant.status === 'dead') {
      // Defeated gets reduced rewards
      expReward = 25;
      goldReward = 10;
    }
    // Fled participants get no rewards
    
    if (expReward > 0) {
      await character.addExperience(expReward);
      await character.addGold(goldReward);
      
      // Update battle stats
      if (participant.status === 'alive' || participant.characterId.toString() === this.winner?.toString()) {
        character.battleStats.wins += 1;
      } else {
        character.battleStats.losses += 1;
      }
      
      await character.save();
    }
    
    // Add reward to battle record
    this.rewards.push({
      characterId: participant.characterId,
      experience: expReward,
      gold: goldReward,
      items: []
    });
  }
  
  return this.save();
};

// Static method to create PvP battle
battleSchema.statics.createPvPBattle = async function(character1Id: string, character2Id: string) {
  const Character = mongoose.model('Character');
  
  const char1 = await Character.findById(character1Id);
  const char2 = await Character.findById(character2Id);
  
  if (!char1 || !char2) {
    throw new Error('Один или оба персонажа не найдены');
  }
  
  const battle = new this({
    type: 'pvp',
    participants: [
      {
        characterId: character1Id,
        team: 1,
        health: char1.health,
        mana: char1.mana,
        status: 'alive',
        actions: []
      },
      {
        characterId: character2Id,
        team: 2,
        health: char2.health,
        mana: char2.mana,
        status: 'alive',
        actions: []
      }
    ],
    status: 'waiting'
  });
  
  return await battle.save();
};

// Static method to find active battles for character
battleSchema.statics.findActiveForCharacter = function(characterId: string) {
  return this.find({
    'participants.characterId': characterId,
    status: { $in: ['waiting', 'active'] }
  })
    .populate('participants.characterId', 'name level')
    .sort({ startedAt: -1 });
};

const Battle = mongoose.model<IBattle>('Battle', battleSchema);

export default Battle;