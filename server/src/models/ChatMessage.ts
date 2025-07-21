import mongoose, { Schema } from 'mongoose';
import { IChatMessage, ChatChannel } from '@/types';

const chatMessageSchema = new Schema<IChatMessage>({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  channel: {
    type: String,
    enum: ['global', 'guild', 'party', 'whisper', 'trade', 'help'],
    required: true
  },
  message: {
    type: String,
    required: [true, 'Сообщение не может быть пустым'],
    trim: true,
    maxlength: [500, 'Сообщение не должно превышать 500 символов']
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
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
chatMessageSchema.index({ channel: 1, timestamp: -1 });
chatMessageSchema.index({ senderId: 1 });
chatMessageSchema.index({ deleted: 1 });

// Edit message
chatMessageSchema.methods.editMessage = function(newMessage: string) {
  if (this.deleted) {
    throw new Error('Нельзя редактировать удаленное сообщение');
  }
  
  // Check if message was sent within last 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  if (this.timestamp < fiveMinutesAgo) {
    throw new Error('Сообщение можно редактировать только в течение 5 минут');
  }
  
  this.message = newMessage;
  this.edited = true;
  this.editedAt = new Date();
  
  return this.save();
};

// Delete message
chatMessageSchema.methods.deleteMessage = function() {
  this.deleted = true;
  this.deletedAt = new Date();
  this.message = '[Сообщение удалено]';
  
  return this.save();
};

// Check if user can edit this message
chatMessageSchema.methods.canEdit = function(userId: string) {
  if (this.deleted) return false;
  if (this.senderId.toString() !== userId) return false;
  
  // Check if message was sent within last 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.timestamp >= fiveMinutesAgo;
};

// Check if user can delete this message
chatMessageSchema.methods.canDelete = function(userId: string, userRole: string = 'player') {
  if (this.deleted) return false;
  
  // Sender can always delete their own message
  if (this.senderId.toString() === userId) return true;
  
  // Moderators and admins can delete any message
  return ['moderator', 'admin'].includes(userRole);
};

// Static method to get recent messages
chatMessageSchema.statics.getRecentMessages = function(
  channel: ChatChannel,
  limit: number = 50,
  before?: Date
) {
  const query: any = { channel, deleted: false };
  
  if (before) {
    query.timestamp = { $lt: before };
  }
  
  return this.find(query)
    .populate('senderId', 'username avatar role')
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get messages for guild
chatMessageSchema.statics.getGuildMessages = function(
  guildId: string,
  limit: number = 50,
  before?: Date
) {
  // This would need to be implemented with a guildId field or by checking user's guild
  // For now, just return guild channel messages
  return this.getRecentMessages('guild', limit, before);
};

// Static method to get whisper conversation
chatMessageSchema.statics.getWhisperConversation = function(
  user1Id: string,
  user2Id: string,
  limit: number = 50,
  before?: Date
) {
  const query: any = {
    channel: 'whisper',
    deleted: false,
    $or: [
      { senderId: user1Id, recipientId: user2Id },
      { senderId: user2Id, recipientId: user1Id }
    ]
  };
  
  if (before) {
    query.timestamp = { $lt: before };
  }
  
  return this.find(query)
    .populate('senderId', 'username avatar')
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to search messages
chatMessageSchema.statics.searchMessages = function(
  searchTerm: string,
  channel?: ChatChannel,
  limit: number = 20
) {
  const query: any = {
    deleted: false,
    message: new RegExp(searchTerm, 'i')
  };
  
  if (channel) {
    query.channel = channel;
  }
  
  return this.find(query)
    .populate('senderId', 'username avatar')
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get message statistics
chatMessageSchema.statics.getMessageStats = function(timeframe: 'day' | 'week' | 'month' = 'day') {
  const now = new Date();
  let startDate: Date;
  
  switch (timeframe) {
    case 'day':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
  }
  
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate },
        deleted: false
      }
    },
    {
      $group: {
        _id: '$channel',
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$senderId' }
      }
    },
    {
      $project: {
        channel: '$_id',
        messageCount: '$count',
        uniqueUserCount: { $size: '$uniqueUsers' },
        _id: 0
      }
    }
  ]);
};

// Static method to clean old messages
chatMessageSchema.statics.cleanOldMessages = function(daysOld: number = 30) {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  
  return this.deleteMany({
    timestamp: { $lt: cutoffDate },
    channel: { $nin: ['guild'] } // Don't delete guild messages
  });
};

// Add recipient field for whisper messages
chatMessageSchema.add({
  recipientId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
});

// Add guildId field for guild messages
chatMessageSchema.add({
  guildId: {
    type: Schema.Types.ObjectId,
    ref: 'Guild',
    default: null
  }
});

// Add partyId field for party messages
chatMessageSchema.add({
  partyId: {
    type: Schema.Types.ObjectId,
    ref: 'Party',
    default: null
  }
});

// Pre-save middleware for validation
chatMessageSchema.pre('save', function(next) {
  // Validate recipient for whisper messages
  if (this.channel === 'whisper' && !this.recipientId) {
    return next(new Error('Сообщение-шепот должно иметь получателя'));
  }
  
  // Validate guild for guild messages
  if (this.channel === 'guild' && !this.guildId) {
    return next(new Error('Сообщение гильдии должно иметь ID гильдии'));
  }
  
  // Filter profanity (basic implementation)
  const profanityWords = ['спам', 'мат1', 'мат2']; // Add actual profanity words
  const message = this.message.toLowerCase();
  
  for (const word of profanityWords) {
    if (message.includes(word)) {
      this.message = this.message.replace(new RegExp(word, 'gi'), '*'.repeat(word.length));
    }
  }
  
  next();
});

const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);

export default ChatMessage;