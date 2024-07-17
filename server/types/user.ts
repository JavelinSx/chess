import { Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  rating: number;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesDraw: number;
  lastLogin: Date;
  isOnline: boolean;
  isGame: boolean;
  winRate: number;
  currentGameId?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}
