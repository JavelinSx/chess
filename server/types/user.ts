import { Document } from 'mongoose';
export interface UserProfileResponse {
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
}

export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export type UserModel = IUser & IUserMethods;

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
