import { Document } from 'mongoose';
export interface UserProfileResponse {
  username: string | undefined;
  email: string | undefined;
}
export interface IUser extends Document {
  _id: string;
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

export interface ClientUser {
  _id: string;
  username: string;
  email: string;
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
}
