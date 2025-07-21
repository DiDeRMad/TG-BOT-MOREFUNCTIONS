import mongoose, { Schema } from 'mongoose';
import { ICharacter, CharacterClass } from '@/types';

const characterStatsSchema = new Schema({
  strength: { type: Number, default: 10, min: 1, max: 1000 },
  dexterity: { type: Number, default: 10, min: 1, max: 1000 },
  intelligence: { type: Number, default: 10, min: 1, max: 1000 },
  vitality: { type: Number, default: 10, min: 1, max: 1000 },
  wisdom: { type: Number, default: 10, min: 1, max: 1000 },
  luck: { type: Number, default: 10, min: 1, max: 1000 }
}, { _id: false });

const locationSchema = new Schema({
  world: { type: String, default: 'starter_world' },
  zone: { type: String, default: 'town_square' },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 }
}, { _id: false });

const equipmentSchema = new Schema({
  weapon: { type: Schema.Types.ObjectId, ref: 'Item', default: null },
  armor: { type: Schema.Types.ObjectId, ref: 'Item', default: null },
  helmet: { type: Schema.Types.ObjectId, ref: 'Item', default: null },
  boots: { type: Schema.Types.ObjectId, ref: 'Item', default: null },
  gloves: { type: Schema.Types.ObjectId, ref: 'Item', default: null },
  ring1: { type: Schema.Types.ObjectId, ref: 'Item', default: null },
  ring2: { type: Schema.Types.ObjectId, ref: 'Item', default: null },
  amulet: { type: Schema.Types.ObjectId, ref: 'Item', default: null }
}, { _id: false });

const skillSchema = new Schema({
  name: { type: String, required: true },
  level: { type: Number, default: 1, min: 1, max: 100 },
  experience: { type: Number, default: 0, min: 0 },
  maxLevel: { type: Number, default: 100 },
  type: { type: String, enum: ['active', 'passive'], required: true },
  cooldown: { type: Number, default: 0 },
  manaCost: { type: Number, default: 0 },
  description: { type: String, required: true }
}, { _id: false });

const characterQuestSchema = new Schema({
  questId: { type: Schema.Types.ObjectId, ref: 'Quest', required: true },
  status: { type: String, enum: ['active', 'completed', 'failed'], default: 'active' },
  progress: [{ type: Number, default: 0 }],
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null }
}, { _id: false });

const battleStatsSchema = new Schema({
  wins: { type: Number, default: 0, min: 0 },
  losses: { type: Number, default: 0, min: 0 },
  draws: { type: Number, default: 0, min: 0 },
  totalDamageDealt: { type: Number, default: 0, min: 0 },
  totalDamageReceived: { type: Number, default: 0, min: 0 },
  monstersKilled: { type: Number, default: 0, min: 0 },
  playersKilled: { type: Number, default: 0, min: 0 },
  bossesKilled: { type: Number, default: 0, min: 0 }
}, { _id: false });

const characterSchema = new Schema<ICharacter>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Имя персонажа обязательно'],
    trim: true,
    minlength: [2, 'Имя персонажа должно быть не менее 2 символов'],
    maxlength: [25, 'Имя персонажа не должно превышать 25 символов'],
    match: [/^[a-zA-Zа-яА-Я0-9_\s]+$/, 'Имя персонажа может содержать только буквы, цифры, пробелы и подчеркивания']
  },
  class: {
    type: String,
    enum: ['warrior', 'mage', 'archer', 'rogue', 'priest', 'paladin'],
    required: [true, 'Класс персонажа обязателен']
  },
  level: {
    type: Number,
    default: 1,
    min: 1,
    max: 1000
  },
  experience: {
    type: Number,
    default: 0,
    min: 0
  },
  experienceToNext: {
    type: Number,
    default: 100
  },
  stats: {
    type: characterStatsSchema,
    default: () => ({})
  },
  health: {
    type: Number,
    default: 100,
    min: 0
  },
  maxHealth: {
    type: Number,
    default: 100,
    min: 1
  },
  mana: {
    type: Number,
    default: 50,
    min: 0
  },
  maxMana: {
    type: Number,
    default: 50,
    min: 0
  },
  gold: {
    type: Number,
    default: 100,
    min: 0
  },
  location: {
    type: locationSchema,
    default: () => ({})
  },
  inventory: [{
    type: Schema.Types.ObjectId,
    ref: 'InventorySlot'
  }],
  equipment: {
    type: equipmentSchema,
    default: () => ({})
  },
  skills: [skillSchema],
  quests: [characterQuestSchema],
  achievements: [{
    type: Schema.Types.ObjectId,
    ref: 'CharacterAchievement'
  }],
  guildId: {
    type: Schema.Types.ObjectId,
    ref: 'Guild',
    default: null
  },
  battleStats: {
    type: battleStatsSchema,
    default: () => ({})
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
characterSchema.index({ userId: 1 });
characterSchema.index({ name: 1 });
characterSchema.index({ level: -1 });
characterSchema.index({ guildId: 1 });
characterSchema.index({ 'location.world': 1, 'location.zone': 1 });

// Validate unique character name per user
characterSchema.index({ userId: 1, name: 1 }, { unique: true });

// Calculate stats based on class and level
characterSchema.methods.calculateBaseStats = function() {
  const baseStats: Record<CharacterClass, any> = {
    warrior: { strength: 15, dexterity: 8, intelligence: 5, vitality: 12, wisdom: 5, luck: 5 },
    mage: { strength: 5, dexterity: 7, intelligence: 15, vitality: 6, wisdom: 12, luck: 5 },
    archer: { strength: 8, dexterity: 15, intelligence: 7, vitality: 8, wisdom: 7, luck: 5 },
    rogue: { strength: 10, dexterity: 12, intelligence: 8, vitality: 7, wisdom: 6, luck: 7 },
    priest: { strength: 6, dexterity: 6, intelligence: 10, vitality: 10, wisdom: 15, luck: 3 },
    paladin: { strength: 12, dexterity: 6, intelligence: 8, vitality: 12, wisdom: 10, luck: 2 }
  };

  const base = baseStats[this.class];
  const levelBonus = Math.floor(this.level / 2);

  this.stats = {
    strength: base.strength + levelBonus,
    dexterity: base.dexterity + levelBonus,
    intelligence: base.intelligence + levelBonus,
    vitality: base.vitality + levelBonus,
    wisdom: base.wisdom + levelBonus,
    luck: base.luck + levelBonus
  };
};

// Calculate max health and mana based on stats
characterSchema.methods.calculateHealthAndMana = function() {
  this.maxHealth = 100 + (this.stats.vitality * 10) + (this.level * 5);
  this.maxMana = 50 + (this.stats.wisdom * 8) + (this.stats.intelligence * 5) + (this.level * 3);
  
  // Ensure current health/mana don't exceed max
  if (this.health > this.maxHealth) this.health = this.maxHealth;
  if (this.mana > this.maxMana) this.mana = this.maxMana;
};

// Add experience and handle level up
characterSchema.methods.addExperience = function(amount: number) {
  this.experience += amount;
  
  while (this.experience >= this.experienceToNext && this.level < 1000) {
    this.experience -= this.experienceToNext;
    this.level += 1;
    this.experienceToNext = Math.floor(100 * Math.pow(1.1, this.level - 1));
    
    // Recalculate stats and health/mana on level up
    this.calculateBaseStats();
    this.calculateHealthAndMana();
    
    // Restore health and mana on level up
    this.health = this.maxHealth;
    this.mana = this.maxMana;
  }
  
  return this.save();
};

// Heal character
characterSchema.methods.heal = function(amount: number) {
  this.health = Math.min(this.health + amount, this.maxHealth);
  return this.save();
};

// Restore mana
characterSchema.methods.restoreMana = function(amount: number) {
  this.mana = Math.min(this.mana + amount, this.maxMana);
  return this.save();
};

// Take damage
characterSchema.methods.takeDamage = function(amount: number) {
  this.health = Math.max(0, this.health - amount);
  this.battleStats.totalDamageReceived += amount;
  return this.save();
};

// Add gold
characterSchema.methods.addGold = function(amount: number) {
  this.gold += amount;
  return this.save();
};

// Remove gold
characterSchema.methods.removeGold = function(amount: number) {
  if (this.gold >= amount) {
    this.gold -= amount;
    return true;
  }
  return false;
};

// Learn skill
characterSchema.methods.learnSkill = function(skillData: any) {
  const existingSkill = this.skills.find(skill => skill.name === skillData.name);
  
  if (existingSkill) {
    existingSkill.level = Math.min(existingSkill.level + 1, existingSkill.maxLevel);
    existingSkill.experience = 0;
  } else {
    this.skills.push(skillData);
  }
  
  return this.save();
};

// Add quest
characterSchema.methods.addQuest = function(questId: string) {
  const existingQuest = this.quests.find(q => q.questId.toString() === questId);
  
  if (!existingQuest) {
    this.quests.push({
      questId: questId as any,
      status: 'active',
      progress: [0],
      startedAt: new Date()
    });
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Complete quest
characterSchema.methods.completeQuest = function(questId: string) {
  const quest = this.quests.find(q => q.questId.toString() === questId);
  
  if (quest && quest.status === 'active') {
    quest.status = 'completed';
    quest.completedAt = new Date();
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Static method to find by user
characterSchema.statics.findByUser = function(userId: string) {
  return this.find({ userId })
    .populate('inventory')
    .populate('achievements');
};

// Pre-save middleware to calculate stats
characterSchema.pre('save', function(next) {
  if (this.isNew) {
    this.calculateBaseStats();
    this.calculateHealthAndMana();
  }
  next();
});

const Character = mongoose.model<ICharacter>('Character', characterSchema);

export default Character;