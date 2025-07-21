import mongoose, { Schema } from 'mongoose';
import { IItem, ItemType, ItemRarity } from '@/types';

const itemEffectSchema = new Schema({
  type: {
    type: String,
    enum: ['heal', 'mana', 'buff', 'debuff', 'damage'],
    required: true
  },
  value: { type: Number, required: true },
  duration: { type: Number, default: 0 },
  description: { type: String, required: true }
}, { _id: false });

const itemRequirementsSchema = new Schema({
  level: { type: Number, min: 1 },
  class: [{ type: String, enum: ['warrior', 'mage', 'archer', 'rogue', 'priest', 'paladin'] }],
  stats: {
    strength: { type: Number, min: 0 },
    dexterity: { type: Number, min: 0 },
    intelligence: { type: Number, min: 0 },
    vitality: { type: Number, min: 0 },
    wisdom: { type: Number, min: 0 },
    luck: { type: Number, min: 0 }
  }
}, { _id: false });

const itemStatsSchema = new Schema({
  strength: { type: Number, default: 0 },
  dexterity: { type: Number, default: 0 },
  intelligence: { type: Number, default: 0 },
  vitality: { type: Number, default: 0 },
  wisdom: { type: Number, default: 0 },
  luck: { type: Number, default: 0 }
}, { _id: false });

const itemSchema = new Schema<IItem>({
  name: {
    type: String,
    required: [true, 'Название предмета обязательно'],
    trim: true,
    maxlength: [50, 'Название предмета не должно превышать 50 символов']
  },
  description: {
    type: String,
    required: [true, 'Описание предмета обязательно'],
    maxlength: [500, 'Описание не должно превышать 500 символов']
  },
  type: {
    type: String,
    enum: ['weapon', 'armor', 'helmet', 'boots', 'gloves', 'ring', 'amulet', 'consumable', 'material', 'quest'],
    required: [true, 'Тип предмета обязателен']
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'],
    default: 'common'
  },
  level: {
    type: Number,
    required: [true, 'Уровень предмета обязателен'],
    min: 1,
    max: 1000
  },
  value: {
    type: Number,
    default: 1,
    min: 0
  },
  stackable: {
    type: Boolean,
    default: false
  },
  maxStack: {
    type: Number,
    default: 1,
    min: 1
  },
  stats: {
    type: itemStatsSchema,
    default: null
  },
  effects: [itemEffectSchema],
  requirements: {
    type: itemRequirementsSchema,
    default: null
  },
  durability: {
    type: Number,
    default: null
  },
  maxDurability: {
    type: Number,
    default: null
  },
  iconUrl: {
    type: String,
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
itemSchema.index({ type: 1, level: 1 });
itemSchema.index({ rarity: 1 });
itemSchema.index({ name: 'text', description: 'text' });

// Calculate item value based on level and rarity
itemSchema.methods.calculateValue = function() {
  const rarityMultipliers = {
    common: 1,
    uncommon: 2,
    rare: 4,
    epic: 8,
    legendary: 16,
    mythic: 32
  };

  const baseValue = this.level * 10;
  const rarityMultiplier = rarityMultipliers[this.rarity as keyof typeof rarityMultipliers];
  
  // Add stats bonus to value
  let statsBonus = 0;
  if (this.stats) {
    statsBonus = Object.values(this.stats).reduce((sum: number, stat: any) => sum + (stat || 0), 0) * 5;
  }

  this.value = Math.floor((baseValue + statsBonus) * rarityMultiplier);
  return this.value;
};

// Check if character can use this item
itemSchema.methods.canUse = function(character: any) {
  if (!this.requirements) return true;

  // Check level requirement
  if (this.requirements.level && character.level < this.requirements.level) {
    return false;
  }

  // Check class requirement
  if (this.requirements.class && this.requirements.class.length > 0) {
    if (!this.requirements.class.includes(character.class)) {
      return false;
    }
  }

  // Check stats requirements
  if (this.requirements.stats) {
    const charStats = character.stats;
    for (const [stat, requirement] of Object.entries(this.requirements.stats)) {
      if (requirement && charStats[stat] < requirement) {
        return false;
      }
    }
  }

  return true;
};

// Get rarity color for UI
itemSchema.methods.getRarityColor = function() {
  const colors = {
    common: '#808080',    // Gray
    uncommon: '#00FF00',  // Green
    rare: '#0080FF',      // Blue
    epic: '#8000FF',      // Purple
    legendary: '#FF8000', // Orange
    mythic: '#FF0080'     // Pink
  };
  
  return colors[this.rarity as keyof typeof colors] || colors.common;
};

// Static method to find items by type
itemSchema.statics.findByType = function(type: ItemType, level?: number) {
  const query: any = { type };
  if (level) {
    query.level = { $lte: level };
  }
  return this.find(query).sort({ level: 1, rarity: 1 });
};

// Static method to find equipment for character
itemSchema.statics.findEquipment = function(characterLevel: number, characterClass: string) {
  return this.find({
    type: { $in: ['weapon', 'armor', 'helmet', 'boots', 'gloves', 'ring', 'amulet'] },
    level: { $lte: characterLevel },
    $or: [
      { 'requirements.class': { $exists: false } },
      { 'requirements.class': { $in: [characterClass] } }
    ]
  }).sort({ level: -1, rarity: -1 });
};

// Static method to generate random loot
itemSchema.statics.generateLoot = function(level: number, rarityChance: any = {}) {
  const defaultChances = {
    common: 0.6,
    uncommon: 0.25,
    rare: 0.1,
    epic: 0.04,
    legendary: 0.009,
    mythic: 0.001
  };

  const chances = { ...defaultChances, ...rarityChance };
  let random = Math.random();
  let selectedRarity = 'common';

  for (const [rarity, chance] of Object.entries(chances)) {
    if (random <= chance) {
      selectedRarity = rarity;
      break;
    }
    random -= chance;
  }

  return this.findOne({
    level: { $lte: level, $gte: Math.max(1, level - 5) },
    rarity: selectedRarity
  });
};

// Pre-save middleware to calculate value
itemSchema.pre('save', function(next) {
  if (this.isNew || this.isModified(['level', 'rarity', 'stats'])) {
    this.calculateValue();
  }
  
  // Set max stack for stackable items
  if (this.stackable && !this.maxStack) {
    this.maxStack = this.type === 'consumable' ? 99 : 1;
  }

  // Set durability for equipment
  if (!this.durability && ['weapon', 'armor', 'helmet', 'boots', 'gloves'].includes(this.type)) {
    this.maxDurability = this.level * 10;
    this.durability = this.maxDurability;
  }

  next();
});

const Item = mongoose.model<IItem>('Item', itemSchema);

export default Item;