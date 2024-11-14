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
    console.log('Exchange code params:', {
      code_length: code?.length,
      verifier_length: codeVerifier?.length,
      device_id,
      redirect_uri: config.public.vkRedirectUri,
    });

    const requestBody = {
      grant_type: 'authorization_code',
      client_id: config.public.vkClientId,
      client_secret: config.vkClientSecret,
      redirect_uri: config.public.vkRedirectUri,
      code,
      code_verifier: codeVerifier,
      device_id,
    };

    console.log('Request body:', requestBody);

    const tokenResponse = await $fetch<ResponseTokenVK>('https://id.vk.com/oauth2/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(requestBody).toString(),
    });

    // Безопасное логирование ответа (без sensitive данных)
    console.log('Token response structure:', {
      hasAccessToken: !!tokenResponse.access_token,
      hasRefreshToken: !!tokenResponse.refresh_token,
      hasIdToken: !!tokenResponse.id_token,
      rawResponse: JSON.stringify(tokenResponse),
    });

    if (!tokenResponse.access_token) {
      const errorDetails = {
        tokenResponse: JSON.stringify(tokenResponse),
        responseType: typeof tokenResponse,
        responseKeys: Object.keys(tokenResponse),
      };
      console.error('Token response error details:', errorDetails);
      return {
        data: null,
        error: `Failed to get access token VK. Response: ${JSON.stringify(errorDetails)}`,
      };
    }

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
    const errorDetails =
      error instanceof Error
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
            // Добавляем дополнительные свойства, если они есть
            ...((error as any).response && {
              response: {
                status: (error as any).response.status,
                data: (error as any).response.data,
              },
            }),
          }
        : error;

    console.error('Exchange code detailed error:', errorDetails);

    return {
      data: null,
      error: `Failed to exchange code: ${JSON.stringify(errorDetails)}`,
    };
  }
};

export const completeAuthentication = async (event: H3Event): Promise<ApiResponse<AuthData>> => {
  const config = useRuntimeConfig();

  try {
    const accessToken = getCookie(event, 'vk_access_token');
    console.log('Access token exists:', !!accessToken);

    if (!accessToken) {
      return { data: null, error: 'No access token found' };
    }

    const userInfoResponse = await $fetch<VKUserInfo>('https://id.vk.com/oauth2/user_info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.public.vkClientId,
        access_token: accessToken,
      }).toString(),
    });

    console.log('User info response:', JSON.stringify(userInfoResponse, null, 2));

    if (!userInfoResponse || (!userInfoResponse.user && !userInfoResponse.user_id)) {
      throw new Error(`Invalid user info response: ${JSON.stringify(userInfoResponse)}`);
    }

    // Извлекаем данные пользователя в зависимости от формата ответа
    const userData = userInfoResponse.user || userInfoResponse;
    const userId = userData.user_id?.toString() || userData.toString();

    if (!userId) {
      throw new Error(`Could not extract user ID from response: ${JSON.stringify(userData)}`);
    }

    const user = await User.findOneAndUpdate(
      { vkId: userId },
      {
        $set: {
          vkId: userId,
          vkAccessToken: accessToken,
          username:
            userData.first_name && userData.last_name
              ? `${userData.first_name} ${userData.last_name}`
              : `VK User ${userId}`,
          email: userData.email,
          avatar: userData.avatar,
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
    const errorDetails =
      error instanceof Error
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
            // Добавляем дополнительные свойства ошибки запроса, если они есть
            ...((error as any).response && {
              response: {
                status: (error as any).response.status,
                data: (error as any).response.data,
              },
            }),
          }
        : error;

    console.error('Complete authentication detailed error:', errorDetails);

    return {
      data: null,
      error: `Authentication failed: ${JSON.stringify(errorDetails)}`,
    };
  }
};
