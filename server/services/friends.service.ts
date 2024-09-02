import User from '../db/models/user.model';
import type { FriendRequest, FriendRequestStatus, Friend, FriendRequestClient } from '~/server/types/friends';
import type { IUser } from '~/server/types/user';
import mongoose from 'mongoose';
import { sseManager } from '../utils/SSEManager';

export const friendsService = {
  async sendFriendRequest(fromUserId: string, toUserId: string): Promise<FriendRequest> {
    // Проверяем, существует ли уже запрос на дружбу
    const existingRequest = await User.findOne({
      $or: [
        { _id: fromUserId, 'friendRequests.to': toUserId },
        { _id: toUserId, 'friendRequests.from': fromUserId },
      ],
    });

    if (existingRequest) {
      throw new Error('Friend request already exists');
    }

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

    // Отправляем уведомление получателю запроса
    await sseManager.sendFriendRequestNotification(toUserId, createdRequest);

    return createdRequest;
  },

  async respondToFriendRequest(requestId: string, userId: string, accept: boolean) {
    console.log(`Responding to friend request: ${requestId}, userId: ${userId}, accept: ${accept}`);

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const requestIndex = user.friendRequests.findIndex((req) => req._id.toString() === requestId);
    if (requestIndex === -1) {
      throw new Error('Friend request not found');
    }

    const request = user.friendRequests[requestIndex];

    // Создаем объект с нужными свойствами для клиента
    const requestDataForClient: FriendRequestClient = {
      _id: request._id.toString(),
      from: request.from.toString(),
      to: request.to.toString(),
      status: request.status,
      createdAt: request.createdAt.toISOString(),
    };

    if (accept) {
      console.log('Accepting friend request');
      request.status = 'accepted';
      user.friends.push(request.from);
      const requester = await User.findById(request.from);
      if (!requester) {
        throw new Error('Requester not found');
      }
      requester.friends.push(new mongoose.Types.ObjectId(userId));

      await Promise.all([user.save(), requester.save()]);

      console.log('Friends lists updated in database');

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
      console.log('Rejecting friend request');
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
    console.log(`Removing friend: userId ${userId}, friendId ${friendId}`);

    const [user, friend] = await Promise.all([
      User.findByIdAndUpdate(
        userId,
        { $pull: { friends: new mongoose.Types.ObjectId(friendId) } },
        { new: true }
      ).populate<{ friends: Friend[] }>('friends', 'username isOnline isGame'),
      User.findByIdAndUpdate(
        friendId,
        { $pull: { friends: new mongoose.Types.ObjectId(userId) } },
        { new: true }
      ).populate<{ friends: Friend[] }>('friends', 'username isOnline isGame'),
    ]);

    if (!user || !friend) {
      throw new Error('User or friend not found');
    }

    console.log(`Friends removed successfully`);
    console.log(`Updated friends list for user ${userId}:`, user.friends);
    console.log(`Updated friends list for user ${friendId}:`, friend.friends);

    // Отправляем обновленные списки друзей обоим пользователям
    await Promise.all([
      sseManager.sendFriendListUpdateNotification(userId, user.friends),
      sseManager.sendFriendListUpdateNotification(friendId, friend.friends),
    ]);

    return { success: true, message: 'Friend removed successfully' };
  },

  async getFriendRequests(userId: string): Promise<FriendRequestClient[]> {
    const user = await User.findById(userId).populate('friendRequests.from', 'username');

    if (!user) {
      throw new Error('User not found');
    }

    return user.friendRequests.map((request: FriendRequest) => ({
      _id: request._id.toString(),
      from: request.from._id.toString(), // Преобразуем ObjectId в строку
      to: request.to.toString(),
      status: request.status,
      createdAt: request.createdAt.toISOString(),
    }));
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
