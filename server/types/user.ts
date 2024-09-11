import mongoose, { Document } from 'mongoose';
import type { Friend, FriendRequest } from './friends';

export interface UserProfileResponse {
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
  friends: mongoose.Types.ObjectId[];
  chatSettings: boolean;
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
  friends: Friend[];
  friendRequests: FriendRequest[];
  chatSettings: boolean;
}

export interface IUserMethods {
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
  friends: Friend[];
  currentGameId?: string;
  chatSettings: boolean;
}

export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export type UserModel = IUser & IUserMethods;
