import mongoose from 'mongoose';

export interface FriendsData {
  friends: Friend[];
  friendRequests: FriendRequestClient[];
}

export interface Friend {
  _id: string;
  username: string;
  isOnline: boolean;
  isGame: boolean;
}

export interface FriendRequest {
  _id: mongoose.Types.ObjectId;
  from: mongoose.Types.ObjectId;
  to: mongoose.Types.ObjectId;
  status: FriendRequestStatus;
  createdAt: Date;
}

export interface FriendRequestClient {
  _id: string;
  from: string;
  to: string;
  status: FriendRequestStatus;
  createdAt: string;
}

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';
