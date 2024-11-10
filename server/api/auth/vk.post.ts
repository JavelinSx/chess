// server/api/auth/vk.post.ts
import { defineEventHandler, readBody } from 'h3';
import jwt from 'jsonwebtoken';
import User from '~/server/db/models/user.model';
import type { ClientUser } from '~/server/types/user';
import type { ApiResponse } from '~/server/types/api';
import type { AuthData } from '~/server/types/auth';

export default defineEventHandler(async (event) => {
  try {
    const { vkAuthData } = await readBody(event);

    // Проверяем существует ли пользователь с таким vk id
    let user = await User.findOne({ vkId: vkAuthData.id });

    if (!user) {
      // Если пользователя нет, создаем нового
      user = new User({
        username: vkAuthData.name,
        email: vkAuthData.email,
        vkId: vkAuthData.id,
        vkAccessToken: vkAuthData.access_token,
        lastLogin: new Date(), // Явно указываем Date
        rating: 0,
        stats: {
          gamesPlayed: 0,
          gamesWon: 0,
          gamesLost: 0,
          gamesDraw: 0,
          capturedPawns: 0,
          checksGiven: 0,
          castlingsMade: 0,
          promotions: 0,
          enPassantCaptures: 0,
          queenSacrifices: 0,
          averageMovesPerGame: 0,
          longestGame: 0,
          shortestWin: 0,
          averageRatingChange: 0,
          winStreakBest: 0,
          currentWinStreak: 0,
          resignations: 0,
          gamesByDuration: {
            15: 0,
            30: 0,
            45: 0,
            90: 0,
          },
        },
        isOnline: true,
        isGame: false,
        winRate: 0,
        chatSetting: 'all',
        friends: [],
      });
      await user.save();
    }

    const config = useRuntimeConfig();
    const token = jwt.sign({ userId: user._id.toString() }, config.jwtSecret, { expiresIn: '30d' });

    setCookie(event, 'auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    // Преобразуем user в ClientUser
    const clientUser: ClientUser = {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      rating: user.rating,
      stats: user.stats,
      title: user.title,
      lastLogin: new Date(user.lastLogin),
      isOnline: user.isOnline,
      isGame: user.isGame,
      winRate: user.winRate,
      friends: user.friends,
      chatSetting: user.chatSetting,
      vkId: user.vkId,
    };

    const response: ApiResponse<AuthData> = {
      data: {
        user: clientUser,
        isAuthenticated: true,
      },
      error: null,
    };

    return response;
  } catch (error) {
    console.error('VK auth error:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
});
