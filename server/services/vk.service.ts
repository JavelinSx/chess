// server/services/vk-auth.service.ts

import type { ApiResponse } from '../types/api';
import type { H3Event } from 'h3';
import type { AuthData } from '../types/auth';
import User from '../db/models/user.model';
import jwt from 'jsonwebtoken';

interface ResponseTokenVK {
  refresh_token: string;
  access_token: string;
  id_token: string;
}

interface VKUserInfo {
  user: {
    user_id: string;
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    avatar: string;
  };
}

export const exchangeCode = async (
  event: H3Event,
  code: string,
  codeVerifier: string,
  device_id: string
): Promise<ApiResponse<{ success: boolean }>> => {
  const config = useRuntimeConfig();

  try {
    const tokenResponse = await $fetch<ResponseTokenVK>('https://id.vk.com/oauth2/auth', {
      method: 'POST',
      body: {
        grant_type: 'authorization_code',
        client_id: parseInt(config.public.vkClientId),
        client_secret: config.vkClientSecret,
        redirect_uri: config.public.vkRedirectUri,
        code,
        code_verifier: codeVerifier,
        device_id,
      },
    });

    // Сохраняем токены
    await Promise.all([
      setCookie(event, 'vk_access_token', tokenResponse.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      }),
      setCookie(event, 'vk_refresh_token', tokenResponse.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      }),
      setCookie(event, 'vk_id_token', tokenResponse.id_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      }),
    ]);

    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('Exchange code error:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to exchange code',
    };
  }
};

export const completeAuthentication = async (event: H3Event): Promise<ApiResponse<AuthData>> => {
  const config = useRuntimeConfig();

  try {
    const accessToken = getCookie(event, 'vk_access_token');

    if (!accessToken) {
      return { data: null, error: 'No access token found' };
    }

    const userInfo = await $fetch<VKUserInfo>('https://id.vk.com/oauth2/user_info', {
      method: 'POST',
      body: {
        client_id: parseInt(config.public.vkClientId),
        access_token: accessToken,
      },
    });

    const user = await User.findOneAndUpdate(
      { vkId: userInfo.user.user_id.toString() },
      {
        $set: {
          vkId: userInfo.user.user_id.toString(),
          vkAccessToken: accessToken,
          username: `${userInfo.user.first_name} ${userInfo.user.last_name}`,
          email: userInfo.user.email,
          avatar: userInfo.user.avatar,
          isOnline: true,
          lastLogin: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    const jwtToken = jwt.sign({ userId: user._id.toString() }, config.jwtSecret, { expiresIn: '30d' });

    setCookie(event, 'auth_token', jwtToken, {
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
    console.error('Complete authentication error:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to complete authentication',
    };
  }
};

export const vkAuthService = {
  exchangeCode,
  completeAuthentication,
};
