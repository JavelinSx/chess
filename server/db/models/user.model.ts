import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import type { IUser } from '~/server/types/user';

const userSchema = new mongoose.Schema<IUser>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
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
});

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = function (candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
