import mongoose, { Schema } from 'mongoose';
import { IMonster } from '@/types';

const dropTableEntrySchema = new Schema({
  itemId: {
    type: Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  chance: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  minQuantity: {
    type: Number,
    default: 1,
    min: 1
  },
  maxQuantity: {
    type: Number,
    default: 1,
    min: 1
  }
}, { _id: false });

const monsterStatsSchema = new Schema({
  strength: { type: Number, default: 10, min: 1 },
  dexterity: { type: Number, default: 10, min: 1 },
  intelligence: { type: Number, default: 10, min: 1 },
  vitality: { type: Number, default: 10, min: 1 },
  wisdom: { type: Number, default: 10, min: 1 },
  luck: { type: Number, default: 10, min: 1 }
}, { _id: false });

const locationSchema = new Schema({
  world: { type: String, required: true },
  zone: { type: String, required: true },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 }
}, { _id: false });

const monsterSchema = new Schema<IMonster>({
  name: {
    type: String,
    required: [true, 'Имя монстра обязательно'],
    trim: true,
    maxlength: [50, 'Имя монстра не должно превышать 50 символов']
  },
  description: {
    type: String,
    required: [true, 'Описание монстра обязательно'],
    maxlength: [500, 'Описание не должно превышать 500 символов']
  },
  level: {
    type: Number,
    required: [true, 'Уровень монстра обязателен'],
    min: 1,
    max: 1000
  },
  stats: {
    type: monsterStatsSchema,
    required: true
  },
  health: {
    type: Number,
    required: true,
    min: 1
  },
  maxHealth: {
    type: Number,
    required: true,
    min: 1
  },
  mana: {
    type: Number,
    default: 0,
    min: 0
  },
  maxMana: {
    type: Number,
    default: 0,
    min: 0
  },
  skills: [{
    type: String,
    trim: true
  }],
  dropTable: {
    type: [dropTableEntrySchema],
    default: []
  },
  experienceReward: {
    type: Number,
    required: true,
    min: 1
  },
  goldReward: {
    type: Number,
    required: true,
    min: 0
  },
  respawnTime: {
    type: Number, // in seconds
    default: 300 // 5 minutes
  },
  location: {
    type: locationSchema,
    default: null
  },
  aiType: {
    type: String,
    enum: ['aggressive', 'passive', 'defensive', 'boss'],
    default: 'aggressive'
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
monsterSchema.index({ level: 1 });
monsterSchema.index({ 'location.world': 1, 'location.zone': 1 });
monsterSchema.index({ aiType: 1 });

// Calculate base stats based on level
monsterSchema.methods.calculateBaseStats = function() {
  const baseStats = {
    strength: 8 + Math.floor(this.level * 1.2),
    dexterity: 8 + Math.floor(this.level * 1.1),
    intelligence: 6 + Math.floor(this.level * 0.8),
    vitality: 10 + Math.floor(this.level * 1.5),
    wisdom: 6 + Math.floor(this.level * 0.8),
    luck: 5 + Math.floor(this.level * 0.5)
  };

  // Apply type modifiers
  const typeModifiers = {
    aggressive: { strength: 1.2, dexterity: 1.1, vitality: 1.0 },
    passive: { strength: 0.8, dexterity: 1.2, vitality: 1.1 },
    defensive: { strength: 0.9, dexterity: 0.8, vitality: 1.4 },
    boss: { strength: 1.5, dexterity: 1.3, vitality: 2.0, intelligence: 1.2, wisdom: 1.2 }
  };

  const modifier = typeModifiers[this.aiType];
  if (modifier) {
    Object.keys(modifier).forEach(stat => {
      baseStats[stat as keyof typeof baseStats] = Math.floor(
        baseStats[stat as keyof typeof baseStats] * (modifier as any)[stat]
      );
    });
  }

  this.stats = baseStats;
  
  // Calculate health and mana
  this.maxHealth = 100 + (this.stats.vitality * 15) + (this.level * 10);
  this.health = this.maxHealth;
  
  if (this.aiType === 'boss' || this.stats.intelligence > 15) {
    this.maxMana = 50 + (this.stats.wisdom * 8) + (this.stats.intelligence * 5);
    this.mana = this.maxMana;
  }
};

// Calculate experience reward
monsterSchema.methods.calculateExperienceReward = function() {
  let baseExp = this.level * 10;
  
  const typeMultipliers = {
    aggressive: 1.0,
    passive: 0.7,
    defensive: 0.8,
    boss: 3.0
  };
  
  const multiplier = typeMultipliers[this.aiType];
  this.experienceReward = Math.floor(baseExp * multiplier);
};

// Calculate gold reward
monsterSchema.methods.calculateGoldReward = function() {
  let baseGold = this.level * 5;
  
  const typeMultipliers = {
    aggressive: 1.0,
    passive: 0.8,
    defensive: 0.9,
    boss: 2.5
  };
  
  const multiplier = typeMultipliers[this.aiType];
  this.goldReward = Math.floor(baseGold * multiplier);
};

// Generate loot from drop table
monsterSchema.methods.generateLoot = function() {
  const loot: any[] = [];
  
  for (const dropEntry of this.dropTable) {
    const roll = Math.random();
    if (roll <= dropEntry.chance) {
      const quantity = Math.floor(
        Math.random() * (dropEntry.maxQuantity - dropEntry.minQuantity + 1)
      ) + dropEntry.minQuantity;
      
      loot.push({
        itemId: dropEntry.itemId,
        quantity
      });
    }
  }
  
  return loot;
};

// Get attack damage
monsterSchema.methods.getAttackDamage = function() {
  const baseDamage = this.stats.strength * 2;
  const variance = Math.floor(baseDamage * 0.3);
  return baseDamage + Math.floor(Math.random() * variance) - Math.floor(variance / 2);
};

// Get skill damage
monsterSchema.methods.getSkillDamage = function(skillName: string) {
  // This would be expanded with actual skill definitions
  const baseSkillDamage = this.getAttackDamage() * 1.5;
  const manaCost = Math.floor(this.maxMana * 0.2);
  
  return {
    damage: Math.floor(baseSkillDamage),
    manaCost
  };
};

// Check if monster can use skill
monsterSchema.methods.canUseSkill = function(skillName: string) {
  if (!this.skills.includes(skillName)) {
    return false;
  }
  
  const skillData = this.getSkillDamage(skillName);
  return this.mana >= skillData.manaCost;
};

// Take damage
monsterSchema.methods.takeDamage = function(damage: number) {
  this.health = Math.max(0, this.health - damage);
  return this.health === 0;
};

// Heal
monsterSchema.methods.heal = function(amount: number) {
  this.health = Math.min(this.health + amount, this.maxHealth);
};

// Use mana
monsterSchema.methods.useMana = function(amount: number) {
  if (this.mana >= amount) {
    this.mana -= amount;
    return true;
  }
  return false;
};

// AI decision making
monsterSchema.methods.chooseAction = function(targets: any[]) {
  if (targets.length === 0) {
    return { type: 'defend' };
  }

  const aliveTargets = targets.filter(t => t.health > 0);
  if (aliveTargets.length === 0) {
    return { type: 'defend' };
  }

  // Choose target (usually lowest health)
  const target = aliveTargets.reduce((lowest, current) => 
    current.health < lowest.health ? current : lowest
  );

  // Decide action based on AI type
  switch (this.aiType) {
    case 'aggressive':
      // Always attack, use skills if available
      if (this.skills.length > 0 && Math.random() < 0.3) {
        const availableSkills = this.skills.filter(skill => this.canUseSkill(skill));
        if (availableSkills.length > 0) {
          const skill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
          return { type: 'skill', skillId: skill, targetId: target._id };
        }
      }
      return { type: 'attack', targetId: target._id };
      
    case 'passive':
      // Only attack if health is low or no other choice
      if (this.health < this.maxHealth * 0.3) {
        return { type: 'attack', targetId: target._id };
      }
      return { type: 'defend' };
      
    case 'defensive':
      // Prefer to defend, attack only when necessary
      if (this.health < this.maxHealth * 0.5) {
        return { type: 'defend' };
      }
      return { type: 'attack', targetId: target._id };
      
    case 'boss':
      // Complex AI with skill rotations
      if (this.health < this.maxHealth * 0.2 && this.skills.includes('heal')) {
        return { type: 'skill', skillId: 'heal' };
      }
      
      if (this.skills.length > 0 && Math.random() < 0.5) {
        const availableSkills = this.skills.filter(skill => this.canUseSkill(skill));
        if (availableSkills.length > 0) {
          const skill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
          return { type: 'skill', skillId: skill, targetId: target._id };
        }
      }
      
      return { type: 'attack', targetId: target._id };
      
    default:
      return { type: 'attack', targetId: target._id };
  }
};

// Static method to find monsters by location
monsterSchema.statics.findByLocation = function(world: string, zone: string) {
  return this.find({
    'location.world': world,
    'location.zone': zone
  });
};

// Static method to find monsters by level range
monsterSchema.statics.findByLevelRange = function(minLevel: number, maxLevel: number) {
  return this.find({
    level: { $gte: minLevel, $lte: maxLevel }
  });
};

// Static method to create random encounter
monsterSchema.statics.createRandomEncounter = function(playerLevel: number, location: any) {
  const levelRange = Math.max(1, Math.floor(playerLevel * 0.2));
  const minLevel = Math.max(1, playerLevel - levelRange);
  const maxLevel = playerLevel + levelRange;
  
  return this.findByLevelRange(minLevel, maxLevel);
};

// Pre-save middleware
monsterSchema.pre('save', function(next) {
  if (this.isNew || this.isModified(['level', 'aiType'])) {
    this.calculateBaseStats();
    this.calculateExperienceReward();
    this.calculateGoldReward();
  }
  
  next();
});

const Monster = mongoose.model<IMonster>('Monster', monsterSchema);

export default Monster;