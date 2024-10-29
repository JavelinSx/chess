import mongoose from 'mongoose';
import { comparePassword, hashPassword } from '~/server/utils/auth';
import type { IUser, IUserMethods } from '~/server/types/user';

const githubDataSchema = new mongoose.Schema(
  {
    login: String,
    avatar_url: String,
    html_url: String,
    name: String,
    bio: String,
    location: String,
  },
  { _id: false }
);

const userSchema = new mongoose.Schema<IUser, mongoose.Model<IUser, {}, IUserMethods>>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false, select: false },
  githubId: { type: String, unique: true, sparse: true },
  githubAccessToken: { type: String },
  githubData: githubDataSchema,
  rating: { type: Number, default: 0 },
  title: { type: String, default: 'Beginner' },
  stats: {
    gamesPlayed: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    gamesLost: { type: Number, default: 0 },
    gamesDraw: { type: Number, default: 0 },
    capturedPawns: { type: Number, default: 0 },
    checksGiven: { type: Number, default: 0 },
    castlingsMade: { type: Number, default: 0 },
    promotions: { type: Number, default: 0 },
    averageMovesPerGame: { type: Number, default: 0 },
    longestGame: { type: Number, default: 0 },
    shortestWin: { type: Number, default: 0 },
    comebacks: { type: Number, default: 0 },
    queenSacrifices: { type: Number, default: 0 },
    enPassantCaptures: { type: Number, default: 0 },
    stalemateCaused: { type: Number, default: 0 },
    averageRatingChange: { type: Number, default: 0 },
    winStreakBest: { type: Number, default: 0 },
    currentWinStreak: { type: Number, default: 0 },
    resignations: { type: Number, default: 0 },
    gamesByDuration: {
      15: { type: Number, default: 0 },
      30: { type: Number, default: 0 },
      45: { type: Number, default: 0 },
      90: { type: Number, default: 0 },
    },
  },
  lastLogin: { type: Date, default: Date.now },
  isOnline: { type: Boolean, default: false },
  isGame: { type: Boolean, default: false },
  winRate: { type: Number, default: 0 },
  currentGameId: { type: String, default: null },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friendRequests: [
    {
      from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  chatSetting: {
    type: String,
    enum: ['all', 'friends_only', 'nobody'],
    default: 'all',
  },
  chatRooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom' }],
});

userSchema.index({ chatRooms: 1 });
userSchema.index(
  { 'friendRequests.from': 1, 'friendRequests.to': 1 },
  {
    unique: true,
    partialFilterExpression: {
      'friendRequests.from': { $exists: true },
      'friendRequests.to': { $exists: true },
    },
  }
);
userSchema.set('toObject', {
  transform: function (doc, ret, options) {
    delete ret.password;
    return ret;
  },
});
userSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    this.password = await hashPassword(this.password);
  }
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return comparePassword(candidatePassword, this.password);
};

const User = mongoose.model<IUser, mongoose.Model<IUser, {}, IUserMethods>>('User', userSchema);

export default User;
