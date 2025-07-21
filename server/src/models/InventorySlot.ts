import mongoose, { Schema } from 'mongoose';
import { IInventorySlot } from '@/types';

const inventorySlotSchema = new Schema<IInventorySlot>({
  characterId: {
    type: Schema.Types.ObjectId,
    ref: 'Character',
    required: true
  },
  itemId: {
    type: Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  slot: {
    type: Number,
    required: true,
    min: 0,
    max: 99 // Maximum 100 inventory slots (0-99)
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
inventorySlotSchema.index({ characterId: 1, slot: 1 }, { unique: true });
inventorySlotSchema.index({ characterId: 1, itemId: 1 });

// Static method to find character inventory
inventorySlotSchema.statics.findByCharacter = function(characterId: string) {
  return this.find({ characterId })
    .populate('itemId')
    .sort({ slot: 1 });
};

// Static method to add item to inventory
inventorySlotSchema.statics.addItem = async function(characterId: string, itemId: string, quantity: number = 1) {
  // First, try to find existing slot with same item (for stackable items)
  const item = await mongoose.model('Item').findById(itemId);
  if (!item) {
    throw new Error('Предмет не найден');
  }

  if (item.stackable) {
    const existingSlot = await this.findOne({ characterId, itemId });
    if (existingSlot) {
      const newQuantity = existingSlot.quantity + quantity;
      if (newQuantity <= item.maxStack) {
        existingSlot.quantity = newQuantity;
        return await existingSlot.save();
      } else {
        // If exceeds max stack, update to max and continue with remainder
        const remainder = newQuantity - item.maxStack;
        existingSlot.quantity = item.maxStack;
        await existingSlot.save();
        
        if (remainder > 0) {
          return await this.addItem(characterId, itemId, remainder);
        }
        return existingSlot;
      }
    }
  }

  // Find next available slot
  const nextSlot = await this.findNextAvailableSlot(characterId);
  if (nextSlot === -1) {
    throw new Error('Инвентарь полон');
  }

  // Create new inventory slot
  const inventorySlot = new this({
    characterId,
    itemId,
    quantity: Math.min(quantity, item.stackable ? item.maxStack : 1),
    slot: nextSlot
  });

  return await inventorySlot.save();
};

// Static method to remove item from inventory
inventorySlotSchema.statics.removeItem = async function(characterId: string, itemId: string, quantity: number = 1) {
  const inventorySlot = await this.findOne({ characterId, itemId });
  
  if (!inventorySlot) {
    throw new Error('Предмет не найден в инвентаре');
  }

  if (inventorySlot.quantity <= quantity) {
    // Remove entire slot if quantity is less than or equal to requested amount
    return await inventorySlot.deleteOne();
  } else {
    // Reduce quantity
    inventorySlot.quantity -= quantity;
    return await inventorySlot.save();
  }
};

// Static method to find next available slot
inventorySlotSchema.statics.findNextAvailableSlot = async function(characterId: string) {
  const occupiedSlots = await this.find({ characterId }).select('slot').lean();
  const occupiedSlotNumbers = occupiedSlots.map(slot => slot.slot);
  
  for (let i = 0; i < 100; i++) {
    if (!occupiedSlotNumbers.includes(i)) {
      return i;
    }
  }
  
  return -1; // Inventory is full
};

// Static method to move item to different slot
inventorySlotSchema.statics.moveItem = async function(characterId: string, fromSlot: number, toSlot: number) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const fromSlotItem = await this.findOne({ characterId, slot: fromSlot });
    if (!fromSlotItem) {
      throw new Error('Предмет не найден в указанном слоте');
    }

    const toSlotItem = await this.findOne({ characterId, slot: toSlot });
    
    if (toSlotItem) {
      // Swap items
      await this.updateOne({ characterId, slot: fromSlot }, { slot: -1 }, { session });
      await this.updateOne({ characterId, slot: toSlot }, { slot: fromSlot }, { session });
      await this.updateOne({ characterId, slot: -1 }, { slot: toSlot }, { session });
    } else {
      // Just move to empty slot
      await this.updateOne({ characterId, slot: fromSlot }, { slot: toSlot }, { session });
    }

    await session.commitTransaction();
    return true;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Static method to check if character has item
inventorySlotSchema.statics.hasItem = async function(characterId: string, itemId: string, quantity: number = 1) {
  const inventorySlot = await this.findOne({ characterId, itemId });
  return inventorySlot && inventorySlot.quantity >= quantity;
};

// Static method to get inventory count
inventorySlotSchema.statics.getInventoryCount = async function(characterId: string) {
  return await this.countDocuments({ characterId });
};

const InventorySlot = mongoose.model<IInventorySlot>('InventorySlot', inventorySlotSchema);

export default InventorySlot;