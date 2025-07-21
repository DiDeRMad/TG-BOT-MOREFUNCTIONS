import mongoose, { Schema } from 'mongoose';
import { IGuild } from '@/types';

const guildMemberSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['leader', 'officer', 'member'],
    default: 'member'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  contribution: {
    type: Number,
    default: 0,
    min: 0
  }
}, { _id: false });

const guildSchema = new Schema<IGuild>({
  name: {
    type: String,
    required: [true, 'Название гильдии обязательно'],
    unique: true,
    trim: true,
    minlength: [3, 'Название гильдии должно быть не менее 3 символов'],
    maxlength: [30, 'Название гильдии не должно превышать 30 символов'],
    match: [/^[a-zA-Zа-яА-Я0-9_\s]+$/, 'Название гильдии может содержать только буквы, цифры, пробелы и подчеркивания']
  },
  description: {
    type: String,
    maxlength: [500, 'Описание не должно превышать 500 символов'],
    default: ''
  },
  tag: {
    type: String,
    required: [true, 'Тег гильдии обязателен'],
    unique: true,
    trim: true,
    minlength: [2, 'Тег должен быть не менее 2 символов'],
    maxlength: [5, 'Тег не должен превышать 5 символов'],
    uppercase: true,
    match: [/^[A-Z0-9]+$/, 'Тег может содержать только заглавные буквы и цифры']
  },
  leaderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: {
    type: [guildMemberSchema],
    validate: {
      validator: function(members: any[]) {
        return members.length > 0 && members.length <= this.maxMembers;
      },
      message: 'Количество участников должно быть от 1 до максимального количества'
    }
  },
  level: {
    type: Number,
    default: 1,
    min: 1,
    max: 100
  },
  experience: {
    type: Number,
    default: 0,
    min: 0
  },
  maxMembers: {
    type: Number,
    default: 10,
    min: 5,
    max: 100
  },
  treasury: {
    type: Number,
    default: 0,
    min: 0
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
guildSchema.index({ name: 1 });
guildSchema.index({ tag: 1 });
guildSchema.index({ leaderId: 1 });
guildSchema.index({ level: -1 });
guildSchema.index({ 'members.userId': 1 });

// Calculate experience needed for next level
guildSchema.methods.getExperienceToNext = function() {
  return Math.floor(1000 * Math.pow(1.2, this.level - 1));
};

// Add experience to guild
guildSchema.methods.addExperience = function(amount: number) {
  this.experience += amount;
  
  const expToNext = this.getExperienceToNext();
  while (this.experience >= expToNext && this.level < 100) {
    this.experience -= expToNext;
    this.level += 1;
    
    // Increase max members every 5 levels
    if (this.level % 5 === 0) {
      this.maxMembers = Math.min(this.maxMembers + 2, 100);
    }
  }
  
  return this.save();
};

// Add member to guild
guildSchema.methods.addMember = function(userId: string, role: string = 'member') {
  // Check if user is already a member
  const existingMember = this.members.find(member => member.userId.toString() === userId);
  if (existingMember) {
    throw new Error('Пользователь уже является участником гильдии');
  }
  
  // Check if guild is full
  if (this.members.length >= this.maxMembers) {
    throw new Error('Гильдия заполнена');
  }
  
  this.members.push({
    userId: userId as any,
    role,
    joinedAt: new Date(),
    contribution: 0
  });
  
  return this.save();
};

// Remove member from guild
guildSchema.methods.removeMember = function(userId: string) {
  const memberIndex = this.members.findIndex(member => member.userId.toString() === userId);
  
  if (memberIndex === -1) {
    throw new Error('Участник не найден в гильдии');
  }
  
  // Cannot remove leader
  if (this.members[memberIndex].role === 'leader') {
    throw new Error('Нельзя удалить лидера гильдии');
  }
  
  this.members.splice(memberIndex, 1);
  return this.save();
};

// Change member role
guildSchema.methods.changeMemberRole = function(userId: string, newRole: string) {
  const member = this.members.find(member => member.userId.toString() === userId);
  
  if (!member) {
    throw new Error('Участник не найден в гильдии');
  }
  
  // Cannot change leader role
  if (member.role === 'leader') {
    throw new Error('Нельзя изменить роль лидера');
  }
  
  member.role = newRole as any;
  return this.save();
};

// Transfer leadership
guildSchema.methods.transferLeadership = function(newLeaderId: string) {
  const newLeader = this.members.find(member => member.userId.toString() === newLeaderId);
  
  if (!newLeader) {
    throw new Error('Новый лидер не является участником гильдии');
  }
  
  // Change old leader to officer
  const oldLeader = this.members.find(member => member.role === 'leader');
  if (oldLeader) {
    oldLeader.role = 'officer';
  }
  
  // Set new leader
  newLeader.role = 'leader';
  this.leaderId = newLeaderId as any;
  
  return this.save();
};

// Add contribution
guildSchema.methods.addContribution = function(userId: string, amount: number) {
  const member = this.members.find(member => member.userId.toString() === userId);
  
  if (!member) {
    throw new Error('Участник не найден в гильдии');
  }
  
  member.contribution += amount;
  this.treasury += amount;
  
  // Add guild experience based on contribution
  this.addExperience(Math.floor(amount / 10));
  
  return this.save();
};

// Get member by user ID
guildSchema.methods.getMember = function(userId: string) {
  return this.members.find(member => member.userId.toString() === userId);
};

// Check if user can perform action based on role
guildSchema.methods.canPerformAction = function(userId: string, action: string) {
  const member = this.getMember(userId);
  
  if (!member) {
    return false;
  }
  
  const permissions = {
    leader: ['invite', 'kick', 'promote', 'demote', 'transfer', 'disband', 'withdraw', 'edit'],
    officer: ['invite', 'kick_member', 'promote_member', 'demote_member'],
    member: []
  };
  
  return permissions[member.role as keyof typeof permissions]?.includes(action) || false;
};

// Static method to find guild by user
guildSchema.statics.findByUser = function(userId: string) {
  return this.findOne({ 'members.userId': userId })
    .populate('leaderId', 'username avatar')
    .populate('members.userId', 'username avatar level');
};

// Static method to find top guilds
guildSchema.statics.findTopGuilds = function(limit: number = 10) {
  return this.find()
    .sort({ level: -1, experience: -1 })
    .limit(limit)
    .populate('leaderId', 'username avatar')
    .select('name tag level experience maxMembers members treasury');
};

// Static method to search guilds
guildSchema.statics.searchGuilds = function(query: string, limit: number = 20) {
  return this.find({
    $or: [
      { name: new RegExp(query, 'i') },
      { tag: new RegExp(query, 'i') },
      { description: new RegExp(query, 'i') }
    ]
  })
    .limit(limit)
    .populate('leaderId', 'username avatar')
    .select('name tag level experience maxMembers members description');
};

// Pre-save middleware
guildSchema.pre('save', function(next) {
  // Ensure leader is in members list
  if (this.isModified('leaderId') || this.isNew) {
    const leaderInMembers = this.members.find(member => 
      member.userId.toString() === this.leaderId.toString()
    );
    
    if (!leaderInMembers) {
      this.members.push({
        userId: this.leaderId,
        role: 'leader',
        joinedAt: new Date(),
        contribution: 0
      });
    } else {
      leaderInMembers.role = 'leader';
    }
  }
  
  next();
});

const Guild = mongoose.model<IGuild>('Guild', guildSchema);

export default Guild;