import mongoose from 'mongoose';
import type { Friend, FriendRequest } from './friends';
import type { GameDuration } from './game';

export type ChatSetting = 'all' | 'friends_only' | 'nobody';

export interface GitHubData {
  login: string;
  avatar_url: string;
  html_url: string;
  name: string | null;
  bio: string | null;
  location: string | null;
}

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
  gamesByDuration: {
    15?: number;
    30?: number;
    45?: number;
    90?: number;
  };
}

export interface IUser extends Document {
  _id: string;
  username: string;
  avatar: string;
  email: string;
  password?: string;
  githubId?: string;
  githubAccessToken?: string;
  githubData?: GitHubData;
  vkId?: string;
  vkAccessToken?: string;
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
  avatar: string;
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
  avatar: string;
  username: string;
  email: string;
  githubId?: string;
  githubAccessToken?: string;
  githubData?: GitHubData;
  vkId?: string;
  vkAccessToken?: string;
  rating: number;
  title: string;
  stats: UserStats;
  lastLogin: Date | string;
  isOnline: boolean;
  isGame: boolean;
  winRate: number;
  friends: Friend[];
  currentGameId?: string;
  chatSetting: ChatSetting;
}

export type UserModel = IUser & IUserMethods;
