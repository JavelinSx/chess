import mongoose, { Document } from 'mongoose';
import type { Friend, FriendRequest } from './friends';
export interface SettingChat {
  setting: boolean;
}
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
  friends: Friend[];
  chatSetting: SettingChat;
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
  chatSetting: SettingChat;
  chatRooms: mongoose.Types.ObjectId[];
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
  chatSetting: SettingChat;
}

export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export type UserModel = IUser & IUserMethods;
