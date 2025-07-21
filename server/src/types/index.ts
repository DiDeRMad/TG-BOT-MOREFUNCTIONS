import { Document, ObjectId } from 'mongoose';

// User types
export interface IUser extends Document {
  _id: ObjectId;
  username: string;
  email: string;
  password: string;
  avatar?: string;
  role: 'player' | 'moderator' | 'admin';
  isOnline: boolean;
  lastSeen: Date;
  verified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Character types
export interface ICharacter extends Document {
  _id: ObjectId;
  userId: ObjectId;
  name: string;
  class: CharacterClass;
  level: number;
  experience: number;
  experienceToNext: number;
  stats: ICharacterStats;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  gold: number;
  location: ILocation;
  inventory: ObjectId[];
  equipment: IEquipment;
  skills: ISkill[];
  quests: ICharacterQuest[];
  achievements: ObjectId[];
  guildId?: ObjectId;
  battleStats: IBattleStats;
  createdAt: Date;
  updatedAt: Date;
}

export type CharacterClass = 'warrior' | 'mage' | 'archer' | 'rogue' | 'priest' | 'paladin';

export interface ICharacterStats {
  strength: number;
  dexterity: number;
  intelligence: number;
  vitality: number;
  wisdom: number;
  luck: number;
}

export interface ILocation {
  world: string;
  zone: string;
  x: number;
  y: number;
}

export interface IEquipment {
  weapon?: ObjectId;
  armor?: ObjectId;
  helmet?: ObjectId;
  boots?: ObjectId;
  gloves?: ObjectId;
  ring1?: ObjectId;
  ring2?: ObjectId;
  amulet?: ObjectId;
}

export interface ISkill {
  name: string;
  level: number;
  experience: number;
  maxLevel: number;
  type: 'active' | 'passive';
  cooldown?: number;
  manaCost?: number;
  description: string;
}

export interface IBattleStats {
  wins: number;
  losses: number;
  draws: number;
  totalDamageDealt: number;
  totalDamageReceived: number;
  monstersKilled: number;
  playersKilled: number;
  bossesKilled: number;
}

// Item types
export interface IItem extends Document {
  _id: ObjectId;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  level: number;
  value: number;
  stackable: boolean;
  maxStack?: number;
  stats?: Partial<ICharacterStats>;
  effects?: IItemEffect[];
  requirements?: IItemRequirements;
  durability?: number;
  maxDurability?: number;
  iconUrl?: string;
  createdAt: Date;
}

export type ItemType = 
  | 'weapon' | 'armor' | 'helmet' | 'boots' | 'gloves' 
  | 'ring' | 'amulet' | 'consumable' | 'material' | 'quest';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface IItemEffect {
  type: 'heal' | 'mana' | 'buff' | 'debuff' | 'damage';
  value: number;
  duration?: number;
  description: string;
}

export interface IItemRequirements {
  level?: number;
  class?: CharacterClass[];
  stats?: Partial<ICharacterStats>;
}

// Inventory types
export interface IInventorySlot extends Document {
  _id: ObjectId;
  characterId: ObjectId;
  itemId: ObjectId;
  quantity: number;
  slot: number;
  createdAt: Date;
}

// Quest types
export interface IQuest extends Document {
  _id: ObjectId;
  title: string;
  description: string;
  type: QuestType;
  difficulty: QuestDifficulty;
  level: number;
  objectives: IQuestObjective[];
  rewards: IQuestReward[];
  prerequisites?: ObjectId[];
  repeatable: boolean;
  timeLimit?: number;
  npcId?: ObjectId;
  createdAt: Date;
}

export type QuestType = 'main' | 'side' | 'daily' | 'weekly' | 'event';
export type QuestDifficulty = 'easy' | 'normal' | 'hard' | 'expert' | 'legendary';

export interface IQuestObjective {
  type: 'kill' | 'collect' | 'deliver' | 'talk' | 'explore';
  target: string;
  current: number;
  required: number;
  description: string;
}

export interface IQuestReward {
  type: 'experience' | 'gold' | 'item';
  value?: number;
  itemId?: ObjectId;
  quantity?: number;
}

export interface ICharacterQuest {
  questId: ObjectId;
  status: 'active' | 'completed' | 'failed';
  progress: number[];
  startedAt: Date;
  completedAt?: Date;
}

// Guild types
export interface IGuild extends Document {
  _id: ObjectId;
  name: string;
  description: string;
  tag: string;
  leaderId: ObjectId;
  members: IGuildMember[];
  level: number;
  experience: number;
  maxMembers: number;
  treasury: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGuildMember {
  userId: ObjectId;
  role: 'leader' | 'officer' | 'member';
  joinedAt: Date;
  contribution: number;
}

// Battle types
export interface IBattle extends Document {
  _id: ObjectId;
  type: BattleType;
  participants: IBattleParticipant[];
  status: BattleStatus;
  rounds: IBattleRound[];
  winner?: ObjectId;
  rewards?: IBattleReward[];
  startedAt: Date;
  endedAt?: Date;
}

export type BattleType = 'pve' | 'pvp' | 'guild_war' | 'tournament' | 'boss_raid';
export type BattleStatus = 'waiting' | 'active' | 'completed' | 'cancelled';

export interface IBattleParticipant {
  characterId: ObjectId;
  team: number;
  health: number;
  mana: number;
  status: 'alive' | 'dead' | 'fled';
  actions: IBattleAction[];
}

export interface IBattleRound {
  roundNumber: number;
  actions: IBattleAction[];
  timestamp: Date;
}

export interface IBattleAction {
  characterId: ObjectId;
  type: 'attack' | 'skill' | 'item' | 'defend' | 'flee';
  targetId?: ObjectId;
  skillId?: string;
  itemId?: ObjectId;
  damage?: number;
  healing?: number;
  effects?: string[];
  timestamp: Date;
}

export interface IBattleReward {
  characterId: ObjectId;
  experience: number;
  gold: number;
  items: { itemId: ObjectId; quantity: number }[];
}

// Monster types
export interface IMonster extends Document {
  _id: ObjectId;
  name: string;
  description: string;
  level: number;
  stats: ICharacterStats;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  skills: string[];
  dropTable: IDropTableEntry[];
  experienceReward: number;
  goldReward: number;
  respawnTime?: number;
  location?: ILocation;
  aiType: 'aggressive' | 'passive' | 'defensive' | 'boss';
  createdAt: Date;
}

export interface IDropTableEntry {
  itemId: ObjectId;
  chance: number;
  minQuantity: number;
  maxQuantity: number;
}

// Shop types
export interface IShop extends Document {
  _id: ObjectId;
  name: string;
  type: ShopType;
  npcId?: ObjectId;
  location?: ILocation;
  items: IShopItem[];
  refreshRate?: number;
  lastRefresh?: Date;
  createdAt: Date;
}

export type ShopType = 'general' | 'weapon' | 'armor' | 'magic' | 'alchemy' | 'black_market';

export interface IShopItem {
  itemId: ObjectId;
  price: number;
  stock?: number;
  restockTime?: number;
}

// Chat types
export interface IChatMessage extends Document {
  _id: ObjectId;
  senderId: ObjectId;
  channel: ChatChannel;
  message: string;
  timestamp: Date;
  edited?: boolean;
  editedAt?: Date;
  deleted?: boolean;
  deletedAt?: Date;
}

export type ChatChannel = 'global' | 'guild' | 'party' | 'whisper' | 'trade' | 'help';

// Achievement types
export interface IAchievement extends Document {
  _id: ObjectId;
  name: string;
  description: string;
  category: AchievementCategory;
  type: AchievementType;
  target: number;
  rewards: IAchievementReward[];
  iconUrl?: string;
  hidden: boolean;
  createdAt: Date;
}

export type AchievementCategory = 
  | 'combat' | 'exploration' | 'crafting' | 'social' | 'progression' | 'special';

export type AchievementType = 
  | 'kill_monsters' | 'reach_level' | 'complete_quests' | 'earn_gold' | 'join_guild' | 'win_battles';

export interface IAchievementReward {
  type: 'experience' | 'gold' | 'item' | 'title';
  value?: number;
  itemId?: ObjectId;
  title?: string;
}

export interface ICharacterAchievement extends Document {
  _id: ObjectId;
  characterId: ObjectId;
  achievementId: ObjectId;
  progress: number;
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
}

// Event types
export interface IGameEvent extends Document {
  _id: ObjectId;
  name: string;
  description: string;
  type: EventType;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  conditions: IEventCondition[];
  rewards: IEventReward[];
  participants: ObjectId[];
  createdAt: Date;
}

export type EventType = 'double_exp' | 'boss_spawn' | 'treasure_hunt' | 'pvp_tournament' | 'guild_war';

export interface IEventCondition {
  type: string;
  value: any;
}

export interface IEventReward {
  type: 'experience' | 'gold' | 'item';
  value?: number;
  itemId?: ObjectId;
  quantity?: number;
}

// Leaderboard types
export interface ILeaderboard extends Document {
  _id: ObjectId;
  type: LeaderboardType;
  characterId: ObjectId;
  value: number;
  rank: number;
  updatedAt: Date;
}

export type LeaderboardType = 'level' | 'gold' | 'pvp_wins' | 'monsters_killed' | 'quests_completed';

// Socket types
export interface ISocketUser {
  userId: string;
  characterId?: string;
  username: string;
  room?: string;
  location?: ILocation;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    stack?: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}