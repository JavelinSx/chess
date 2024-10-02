import mongoose from 'mongoose';
import type { Friend, FriendRequest } from './friends';
import type { GameDuration } from './game';

export type ChatSetting = 'all' | 'friends_only' | 'nobody';

export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesDraw: number;
  capturedPawns: number;
  checksGiven: number;
  castlingsMade: number;
  promotions: number;
  enPassantCaptures: number;
  queenSacrifices: number;
  discoveredChecks: number;
  doubleChecks: number;
  averageMovesPerGame: number;
  longestGame: number;
  shortestWin: number;
  resignations: number;
  currentWinStreak: number;
  winStreakBest: number;
  averageRatingChange: number;
  biggestRatingGain: number;
  biggestRatingLoss: number;
  gamesByDuration: { [K in GameDuration]: number };
}

export interface IUser extends Document {
  _id: string;
  username: string;
  email: string;
  password: string;
  rating: number;
  title: string;
  stats: UserStats;
  lastLogin: Date;
  isOnline: boolean;
  isGame: boolean;
  winRate: number;
  currentGameId?: string;
  friends: Friend[];
  friendRequests: FriendRequest[];
  chatSetting: ChatSetting;
  chatRooms: mongoose.Types.ObjectId[];
}

export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface UserProfileResponse {
  _id: string;
  username: string;
  email: string;
  rating: number;
  title: string;
  stats: UserStats;
  lastLogin: Date;
  isOnline: boolean;
  isGame: boolean;
  winRate: number;
  currentGameId?: string;
  friends: Friend[];
  chatSetting: ChatSetting;
}

export interface ClientUser {
  _id: string;
  username: string;
  email: string;
  rating: number;
  title: string;
  stats: UserStats;
  lastLogin: Date;
  isOnline: boolean;
  isGame: boolean;
  winRate: number;
  friends: Friend[];
  currentGameId?: string;
  chatSetting: ChatSetting;
}

export type UserModel = IUser & IUserMethods;
