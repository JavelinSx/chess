import User from '~/server/db/models/user.model';
import { friendsSSEManager } from '../../utils/sseManager/FriendsSSEManager';
import { H3Error } from 'h3';
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { fromUserId, toUserId } = body;

    // Проверка наличия обязательных полей
    if (!fromUserId || !toUserId) {
      throw createError({
        statusCode: 400,
        message: 'Both fromUserId and toUserId are required',
      });
    }

    // Проверка существования отправителя и получателя
    const [fromUser, toUser] = await Promise.all([User.findById(fromUserId), User.findById(toUserId)]);

    if (!fromUser) {
      throw createError({
        statusCode: 404,
        message: 'Sender user not found',
      });
    }

    if (!toUser) {
      throw createError({
        statusCode: 404,
        message: 'Recipient user not found',
      });
    }

    // Проверка, не отправляет ли пользователь запрос самому себе
    if (fromUserId === toUserId) {
      throw createError({
        statusCode: 400,
        message: 'You cannot send a friend request to yourself',
      });
    }

    // Проверка на существующий запрос
    const existingRequest = await User.findOne({
      _id: toUserId,
      'friendRequests.from': fromUserId,
    });

    if (existingRequest) {
      return { message: 'Friend request already sent', alreadyExists: true };
    }

    // Добавление нового запроса на дружбу
    const updatedUser = await User.findByIdAndUpdate(
      toUserId,
      {
        $addToSet: {
          friendRequests: {
            from: fromUserId,
            to: toUserId,
            status: 'pending',
          },
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      throw createError({
        statusCode: 500,
        message: 'Failed to update user',
      });
    }

    // Получение созданного запроса на дружбу
    const createdRequest = updatedUser.friendRequests.find(
      (req) => req.from.toString() === fromUserId && req.to.toString() === toUserId
    );

    if (createdRequest) {
      // Отправка SSE уведомлений
      await friendsSSEManager.sendFriendRequestNotification(toUserId, createdRequest);
      await friendsSSEManager.sendFriendRequestNotification(fromUserId, createdRequest);
    }

    return { message: 'Friend request sent successfully', request: createdRequest };
  } catch (error: unknown) {
    console.error('Error in friend request handler:', error);

    if (error instanceof Error && error.message.includes('E11000 duplicate key error')) {
      // Если произошла ошибка дублирования ключа, значит запрос уже существует
      return { message: 'Friend request already sent', alreadyExists: true };
    }

    if (error instanceof H3Error) {
      throw error;
    } else if (error instanceof Error) {
      throw createError({
        statusCode: 500,
        message: error.message || 'Failed to send friend request',
      });
    } else {
      throw createError({
        statusCode: 500,
        message: 'An unknown error occurred',
      });
    }
  }
});
