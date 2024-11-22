import mongoose from 'mongoose';
import UserListCache from '../utils/UserListCache';
import User from '../db/models/user.model';
import { friendsSSEManager } from '../utils/sseManager/FriendsSSEManager';
import type { FriendRequest, Friend, FriendRequestClient } from '~/server/types/friends';
import type { IUser } from '~/server/types/user';
import type { ApiResponse } from '~/server/types/api';

export const friendsService = {
  async sendFriendRequest(fromUserId: string, toUserId: string): Promise<ApiResponse<FriendRequest>> {
    try {
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
        return { data: null, error: 'User not found' };
      }

      const createdRequest = toUser.friendRequests.find(
        (req) => req.from.toString() === fromUserId && req.to.toString() === toUserId
      );

      if (!createdRequest) {
        return { data: null, error: 'Failed to create friend request' };
      }

      await friendsSSEManager.sendFriendRequestNotification(toUserId, createdRequest);

      return { data: createdRequest, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  },

  async respondToFriendRequest(
    requestId: string,
    userId: string,
    accept: boolean
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { data: null, error: 'User not found' };
      }

      const requestIndex = user.friendRequests.findIndex((req) => req._id.toString() === requestId);
      if (requestIndex === -1) {
        return { data: null, error: 'Friend request not found' };
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
        const friendToAdd: Friend = {
          _id: request.from.toString(),
          username: requestDataForClient.to,
          isOnline: false,
          isGame: false,
        };
        user.friends.push(friendToAdd);

        const requester = await User.findById(request.from);
        if (!requester) {
          return { data: null, error: 'Requester not found' };
        }

        const requesterFriend: Friend = {
          _id: userId,
          username: user.username,
          isOnline: user.isOnline,
          isGame: user.isGame,
        };
        requester.friends.push(requesterFriend);

        friendToAdd.username = requester.username;

        await Promise.all([user.save(), requester.save()]);

        // Обновляем UserListCache
        UserListCache.updateUser(userId, { friends: user.friends });
        UserListCache.updateUser(request.from.toString(), { friends: requester.friends });

        const [userFriendsResponse, requesterFriendsResponse] = await Promise.all([
          this.getFriends(userId),
          this.getFriends(request.from.toString()),
        ]);

        if (userFriendsResponse.error || requesterFriendsResponse.error) {
          return { data: null, error: 'Failed to get updated friend lists' };
        }

        await Promise.all([
          friendsSSEManager.sendFriendListUpdateNotification(userId, userFriendsResponse.data!),
          friendsSSEManager.sendFriendListUpdateNotification(request.from.toString(), requesterFriendsResponse.data!),
          friendsSSEManager.sendFriendRequestUpdateNotification(userId, {
            ...requestDataForClient,
            status: 'accepted',
          }),
          friendsSSEManager.sendFriendRequestUpdateNotification(request.from.toString(), {
            ...requestDataForClient,
            status: 'accepted',
          }),
        ]);
      } else {
        request.status = 'rejected';
        await friendsSSEManager.sendFriendRequestUpdateNotification(userId, {
          ...requestDataForClient,
          status: 'rejected',
        });
        await friendsSSEManager.sendFriendRequestUpdateNotification(request.from.toString(), {
          ...requestDataForClient,
          status: 'rejected',
        });
      }

      user.friendRequests.splice(requestIndex, 1);
      await user.save();

      return { data: { success: true, message: `Friend request ${accept ? 'accepted' : 'rejected'}` }, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  },

  async removeFriend(userId: string, friendId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    try {
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

      const [userFriendsResponse, friendFriendsResponse] = await Promise.all([
        this.getFriends(userId),
        this.getFriends(friendId),
      ]);

      if (userFriendsResponse.error || friendFriendsResponse.error) {
        return { data: null, error: 'Failed to get updated friend lists' };
      }

      await Promise.all([
        friendsSSEManager.sendFriendListUpdateNotification(userId, userFriendsResponse.data!),
        friendsSSEManager.sendFriendListUpdateNotification(friendId, friendFriendsResponse.data!),
      ]);

      return { data: { success: true, message: 'Friend removed successfully' }, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  },

  async getFriendRequests(userId: string): Promise<ApiResponse<FriendRequest[]>> {
    try {
      const user = await User.findById(userId).select('friendRequests');
      if (!user) {
        return { data: null, error: 'User not found' };
      }
      return { data: user.friendRequests, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  },

  async areFriends(userId1: string, userId2: string): Promise<ApiResponse<boolean>> {
    try {
      const user = await User.findById(userId1);
      if (!user) {
        return { data: null, error: 'User not found' };
      }
      const areFriends = user.friends.some((friendId) => friendId.toString() === userId2);
      return { data: areFriends, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  },

  async getFriends(userId: string): Promise<ApiResponse<Friend[]>> {
    try {
      const user = await User.findById(userId).populate<{ friends: IUser[] }>('friends', 'username isOnline isGame');
      if (!user) {
        return { data: null, error: 'User not found' };
      }
      const friends = user.friends.map((friend) => ({
        _id: friend._id.toString(),
        username: friend.username,
        isOnline: friend.isOnline,
        isGame: friend.isGame,
      }));
      return { data: friends, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  },

  async sendFriendListUpdateNotification(userId: string): Promise<ApiResponse<void>> {
    try {
      const friendsResponse = await this.getFriends(userId);
      if (friendsResponse.error) {
        return { data: null, error: friendsResponse.error };
      }
      await friendsSSEManager.sendFriendListUpdateNotification(userId, friendsResponse.data!);
      return { data: undefined, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  },
};
