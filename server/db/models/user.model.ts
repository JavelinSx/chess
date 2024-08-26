import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import type { IUser, IUserMethods } from '~/server/types/user';

const userSchema = new mongoose.Schema<IUser, mongoose.Model<IUser, {}, IUserMethods>>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false }, // password не будет включен в результаты запросов по умолчанию
  rating: { type: Number, default: 1200 },
  gamesPlayed: { type: Number, default: 0 },
  gamesWon: { type: Number, default: 0 },
  gamesLost: { type: Number, default: 0 },
  gamesDraw: { type: Number, default: 0 },
  lastLogin: { type: Date, default: Date.now },
  isOnline: { type: Boolean, default: false },
  isGame: { type: Boolean, default: false },
  winRate: { type: Number, default: 0 },
  currentGameId: { type: String, default: null },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  const user = await this.model('User').findById(this._id).select('+password');
  if (!user) {
    throw new Error('User not found');
  }
  return bcrypt.compare(candidatePassword, user.password);
};

const User = mongoose.model<IUser, mongoose.Model<IUser, {}, IUserMethods>>('User', userSchema);

export default User;
