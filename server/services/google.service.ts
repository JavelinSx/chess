// server/services/google.service.ts
import jwt from 'jsonwebtoken';
import { H3Event } from 'h3';
import User from '../db/models/user.model';
import type { GoogleTokenResponse, GoogleUser } from '../types/google';
import type { ApiResponse } from '../types/api';
import type { AuthData } from '../types/auth';

export async function googleAuth(event: H3Event, code: string): Promise<ApiResponse<AuthData>> {
  const config = useRuntimeConfig();

  try {
    // Получаем access token
    const tokenResponse = await $fetch<GoogleTokenResponse>('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: {
        client_id: config.public.googleClientId,
        client_secret: config.googleClientSecret,
        code,
        redirect_uri: config.public.googleRedirectUri,
        grant_type: 'authorization_code',
      },
    });

    if (!tokenResponse.access_token) {
      throw new Error('Failed to get access token');
    }

    // Получаем данные пользователя
    const googleUser = await $fetch<GoogleUser>('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenResponse.access_token}`,
      },
    });

    let user = await User.findOne({
      $or: [{ googleId: googleUser.id }, { email: googleUser.email }],
    });

    if (!user) {
      user = new User({
        username: googleUser.name,
        email: googleUser.email,
        googleId: googleUser.id,
        googleAccessToken: tokenResponse.access_token,
        avatar: googleUser.picture,
      });
    } else {
      Object.assign(user, {
        googleId: googleUser.id,
        googleAccessToken: tokenResponse.access_token,
        avatar: googleUser.picture,
      });
    }

    user.lastLogin = new Date();
    user.isOnline = true;
    await user.save();

    const token = jwt.sign({ userId: user._id }, config.jwtSecret, { expiresIn: '30d' });

    setCookie(event, 'auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    return {
      data: {
        user: user.toObject(),
        isAuthenticated: true,
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to authenticate with Google',
    };
  }
}
