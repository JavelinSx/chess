import User from '../db/models/user.model';
import type { FriendRequest, FriendRequestStatus, Friend, FriendRequestClient } from '~/server/types/friends';
import type { IUser } from '~/server/types/user';
import mongoose from 'mongoose';
import { sseManager } from '../utils/SSEManager';

export const friendsService = {
  async sendFriendRequest(fromUserId: string, toUserId: string): Promise<FriendRequest> {
    const request: Omit<FriendRequest, '_id'> = {
      from: new mongoose.Types.ObjectId(fromUserId),
      to: new mongoose.Types.ObjectId(toUserId),
      status: 'pending',
      createdAt: new Date(),
    };

    const [fromUser, toUser] = await Promise.all([
      User.findByIdAndUpdate(fromUserId, { $push: { friendRequests: request } }, { new: true }),
      User.findByIdAndUpdate(toUserId, { $push: { friendRequests: request } }, { new: true }),
    ]);

    if (!fromUser || !toUser) {
      throw new Error('User not found');
    }

    const createdRequest = toUser.friendRequests.find(
      (req) => req.from.toString() === fromUserId && req.to.toString() === toUserId
    );

    if (!createdRequest) {
      throw new Error('Failed to create friend request');
    }

    await sseManager.sendFriendRequestNotification(toUserId, createdRequest);

    return createdRequest;
  },

  async respondToFriendRequest(requestId: string, userId: string, accept: boolean) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const requestIndex = user.friendRequests.findIndex((req) => req._id.toString() === requestId);
    if (requestIndex === -1) {
      throw new Error('Friend request not found');
    }

    const request = user.friendRequests[requestIndex];

    const requestDataForClient: FriendRequestClient = {
      _id: request._id.toString(),
      from: request.from.toString(),
      to: request.to.toString(),
      status: request.status,
      createdAt: request.createdAt.toISOString(),
    };

    if (accept) {
      request.status = 'accepted';
      // Создаем объект Friend из ObjectId
      const friendToAdd: Friend = {
        _id: request.from.toString(),
        username: requestDataForClient.to,
        isOnline: false,
        isGame: false,
      };
      user.friends.push(friendToAdd);

      const requester = await User.findById(request.from);
      if (!requester) {
        throw new Error('Requester not found');
      }

      // Создаем объект Friend для requester
      const requesterFriend: Friend = {
        _id: userId,
        username: user.username,
        isOnline: user.isOnline,
        isGame: user.isGame,
      };
      requester.friends.push(requesterFriend);

      // Обновляем username для friendToAdd
      friendToAdd.username = requester.username;

      await Promise.all([user.save(), requester.save()]);

      const [userFriends, requesterFriends] = await Promise.all([
        this.getFriends(userId),
        this.getFriends(request.from.toString()),
      ]);

      await Promise.all([
        sseManager.sendFriendListUpdateNotification(userId, userFriends),
        sseManager.sendFriendListUpdateNotification(request.from.toString(), requesterFriends),
        sseManager.sendFriendRequestUpdateNotification(userId, { ...requestDataForClient, status: 'accepted' }),
        sseManager.sendFriendRequestUpdateNotification(request.from.toString(), {
          ...requestDataForClient,
          status: 'accepted',
        }),
      ]);
    } else {
      request.status = 'rejected';
      await sseManager.sendFriendRequestUpdateNotification(userId, { ...requestDataForClient, status: 'rejected' });
      await sseManager.sendFriendRequestUpdateNotification(request.from.toString(), {
        ...requestDataForClient,
        status: 'rejected',
      });
    }

    user.friendRequests.splice(requestIndex, 1);
    await user.save();

    return { success: true, message: `Friend request ${accept ? 'accepted' : 'rejected'}` };
  },

  async removeFriend(userId: string, friendId: string) {
    const [user, friend] = await Promise.all([
      User.findByIdAndUpdate(
        userId,
        { $pull: { friends: new mongoose.Types.ObjectId(friendId) } },
        { new: true }
      ).populate<{ friends: IUser[] }>('friends', 'username isOnline isGame'),
      User.findByIdAndUpdate(
        friendId,
        { $pull: { friends: new mongoose.Types.ObjectId(userId) } },
        { new: true }
      ).populate<{ friends: IUser[] }>('friends', 'username isOnline isGame'),
    ]);

    if (!user || !friend) {
      throw new Error('User or friend not found');
    }

    const userFriends = await this.getFriends(userId);
    const friendFriends = await this.getFriends(friendId);

    await Promise.all([
      sseManager.sendFriendListUpdateNotification(userId, userFriends),
      sseManager.sendFriendListUpdateNotification(friendId, friendFriends),
    ]);

    return { success: true, message: 'Friend removed successfully' };
  },

  async getFriendRequests(userId: string): Promise<FriendRequest[]> {
    const user = await User.findById(userId).select('friendRequests');
    if (!user) {
      throw new Error('User not found');
    }
    return user.friendRequests;
  },

  async areFriends(userId1: string, userId2: string): Promise<boolean> {
    const user = await User.findById(userId1);
    if (!user) {
      throw new Error('User not found');
    }

    return user.friends.some((friendId) => friendId.toString() === userId2);
  },

  async getFriends(userId: string): Promise<Friend[]> {
    const user = await User.findById(userId).populate<{ friends: IUser[] }>('friends', 'username isOnline isGame');
    if (!user) {
      throw new Error('User not found');
    }
    return user.friends.map((friend) => ({
      _id: friend._id.toString(),
      username: friend.username,
      isOnline: friend.isOnline,
      isGame: friend.isGame,
    }));
  },

  async sendFriendListUpdateNotification(userId: string): Promise<void> {
    const friends = await this.getFriends(userId);
    await sseManager.sendFriendListUpdateNotification(userId, friends);
  },
};
