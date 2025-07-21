import mongoose, { Schema } from 'mongoose';
import { IQuest, QuestType, QuestDifficulty } from '@/types';

const questObjectiveSchema = new Schema({
  type: {
    type: String,
    enum: ['kill', 'collect', 'deliver', 'talk', 'explore'],
    required: true
  },
  target: {
    type: String,
    required: true
  },
  current: {
    type: Number,
    default: 0,
    min: 0
  },
  required: {
    type: Number,
    required: true,
    min: 1
  },
  description: {
    type: String,
    required: true
  }
}, { _id: false });

const questRewardSchema = new Schema({
  type: {
    type: String,
    enum: ['experience', 'gold', 'item'],
    required: true
  },
  value: {
    type: Number,
    default: 0
  },
  itemId: {
    type: Schema.Types.ObjectId,
    ref: 'Item',
    default: null
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  }
}, { _id: false });

const questSchema = new Schema<IQuest>({
  title: {
    type: String,
    required: [true, 'Название квеста обязательно'],
    trim: true,
    maxlength: [100, 'Название квеста не должно превышать 100 символов']
  },
  description: {
    type: String,
    required: [true, 'Описание квеста обязательно'],
    maxlength: [1000, 'Описание не должно превышать 1000 символов']
  },
  type: {
    type: String,
    enum: ['main', 'side', 'daily', 'weekly', 'event'],
    default: 'side'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'normal', 'hard', 'expert', 'legendary'],
    default: 'normal'
  },
  level: {
    type: Number,
    required: [true, 'Уровень квеста обязателен'],
    min: 1,
    max: 1000
  },
  objectives: {
    type: [questObjectiveSchema],
    required: true,
    validate: {
      validator: function(objectives: any[]) {
        return objectives && objectives.length > 0;
      },
      message: 'Квест должен содержать хотя бы одну цель'
    }
  },
  rewards: {
    type: [questRewardSchema],
    required: true,
    validate: {
      validator: function(rewards: any[]) {
        return rewards && rewards.length > 0;
      },
      message: 'Квест должен содержать хотя бы одну награду'
    }
  },
  prerequisites: [{
    type: Schema.Types.ObjectId,
    ref: 'Quest'
  }],
  repeatable: {
    type: Boolean,
    default: false
  },
  timeLimit: {
    type: Number, // in seconds
    default: null
  },
  npcId: {
    type: Schema.Types.ObjectId,
    ref: 'NPC',
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
questSchema.index({ type: 1, level: 1 });
questSchema.index({ difficulty: 1 });
questSchema.index({ title: 'text', description: 'text' });

// Calculate experience reward based on level and difficulty
questSchema.methods.calculateExperienceReward = function() {
  const baseExp = this.level * 50;
  const difficultyMultipliers = {
    easy: 0.7,
    normal: 1.0,
    hard: 1.5,
    expert: 2.0,
    legendary: 3.0
  };
  
  const multiplier = difficultyMultipliers[this.difficulty as keyof typeof difficultyMultipliers];
  return Math.floor(baseExp * multiplier);
};

// Calculate gold reward based on level and difficulty
questSchema.methods.calculateGoldReward = function() {
  const baseGold = this.level * 25;
  const difficultyMultipliers = {
    easy: 0.8,
    normal: 1.0,
    hard: 1.3,
    expert: 1.7,
    legendary: 2.5
  };
  
  const multiplier = difficultyMultipliers[this.difficulty as keyof typeof difficultyMultipliers];
  return Math.floor(baseGold * multiplier);
};

// Check if character meets prerequisites
questSchema.methods.checkPrerequisites = async function(characterId: string) {
  if (!this.prerequisites || this.prerequisites.length === 0) {
    return true;
  }

  const Character = mongoose.model('Character');
  const character = await Character.findById(characterId);
  
  if (!character) {
    return false;
  }

  // Check if all prerequisite quests are completed
  for (const prereqId of this.prerequisites) {
    const completedQuest = character.quests.find(
      (quest: any) => quest.questId.toString() === prereqId.toString() && quest.status === 'completed'
    );
    
    if (!completedQuest) {
      return false;
    }
  }

  return true;
};

// Check if character can accept this quest
questSchema.methods.canAccept = async function(characterId: string) {
  const Character = mongoose.model('Character');
  const character = await Character.findById(characterId);
  
  if (!character) {
    return false;
  }

  // Check level requirement
  if (character.level < this.level) {
    return false;
  }

  // Check if already has this quest
  const existingQuest = character.quests.find(
    (quest: any) => quest.questId.toString() === this._id.toString() && quest.status === 'active'
  );
  
  if (existingQuest) {
    return false;
  }

  // Check if already completed (for non-repeatable quests)
  if (!this.repeatable) {
    const completedQuest = character.quests.find(
      (quest: any) => quest.questId.toString() === this._id.toString() && quest.status === 'completed'
    );
    
    if (completedQuest) {
      return false;
    }
  }

  // Check prerequisites
  return await this.checkPrerequisites(characterId);
};

// Get quest progress for character
questSchema.methods.getProgress = async function(characterId: string) {
  const Character = mongoose.model('Character');
  const character = await Character.findById(characterId);
  
  if (!character) {
    return null;
  }

  const characterQuest = character.quests.find(
    (quest: any) => quest.questId.toString() === this._id.toString() && quest.status === 'active'
  );

  return characterQuest || null;
};

// Check if quest is completed
questSchema.methods.isCompleted = function(progress: number[]) {
  if (!progress || progress.length !== this.objectives.length) {
    return false;
  }

  return this.objectives.every((objective: any, index: number) => {
    return progress[index] >= objective.required;
  });
};

// Update quest progress
questSchema.methods.updateProgress = async function(characterId: string, objectiveIndex: number, amount: number = 1) {
  const Character = mongoose.model('Character');
  const character = await Character.findById(characterId);
  
  if (!character) {
    throw new Error('Персонаж не найден');
  }

  const questIndex = character.quests.findIndex(
    (quest: any) => quest.questId.toString() === this._id.toString() && quest.status === 'active'
  );

  if (questIndex === -1) {
    throw new Error('Активный квест не найден');
  }

  const quest = character.quests[questIndex];
  const objective = this.objectives[objectiveIndex];

  if (!objective) {
    throw new Error('Цель квеста не найдена');
  }

  // Update progress
  if (!quest.progress[objectiveIndex]) {
    quest.progress[objectiveIndex] = 0;
  }
  
  quest.progress[objectiveIndex] = Math.min(
    quest.progress[objectiveIndex] + amount,
    objective.required
  );

  // Check if quest is completed
  if (this.isCompleted(quest.progress)) {
    quest.status = 'completed';
    quest.completedAt = new Date();
    
    // Award rewards
    await this.awardRewards(characterId);
  }

  return await character.save();
};

// Award quest rewards
questSchema.methods.awardRewards = async function(characterId: string) {
  const Character = mongoose.model('Character');
  const InventorySlot = mongoose.model('InventorySlot');
  const character = await Character.findById(characterId);
  
  if (!character) {
    throw new Error('Персонаж не найден');
  }

  for (const reward of this.rewards) {
    switch (reward.type) {
      case 'experience':
        await character.addExperience(reward.value || this.calculateExperienceReward());
        break;
        
      case 'gold':
        await character.addGold(reward.value || this.calculateGoldReward());
        break;
        
      case 'item':
        if (reward.itemId) {
          await InventorySlot.addItem(characterId, reward.itemId.toString(), reward.quantity || 1);
        }
        break;
    }
  }

  return character;
};

// Static method to find available quests for character
questSchema.statics.findAvailableForCharacter = async function(characterId: string) {
  const Character = mongoose.model('Character');
  const character = await Character.findById(characterId);
  
  if (!character) {
    return [];
  }

  const quests = await this.find({
    level: { $lte: character.level }
  });

  const availableQuests = [];
  
  for (const quest of quests) {
    if (await quest.canAccept(characterId)) {
      availableQuests.push(quest);
    }
  }

  return availableQuests;
};

// Static method to find daily/weekly quests
questSchema.statics.findByType = function(type: QuestType, level?: number) {
  const query: any = { type };
  if (level) {
    query.level = { $lte: level };
  }
  return this.find(query).sort({ level: 1 });
};

// Pre-save middleware to calculate default rewards
questSchema.pre('save', function(next) {
  if (this.isNew) {
    // Add default experience reward if not specified
    const hasExpReward = this.rewards.some(reward => reward.type === 'experience');
    if (!hasExpReward) {
      this.rewards.push({
        type: 'experience',
        value: this.calculateExperienceReward(),
        quantity: 1
      } as any);
    }

    // Add default gold reward if not specified
    const hasGoldReward = this.rewards.some(reward => reward.type === 'gold');
    if (!hasGoldReward) {
      this.rewards.push({
        type: 'gold',
        value: this.calculateGoldReward(),
        quantity: 1
      } as any);
    }
  }
  
  next();
});

const Quest = mongoose.model<IQuest>('Quest', questSchema);

export default Quest;