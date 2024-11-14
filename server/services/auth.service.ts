import type { ApiResponse } from '~/server/types/api';
import type { AuthData } from '../types/auth';
import User from '~/server/db/models/user.model.js';
import jwt from 'jsonwebtoken';
import { H3Event } from 'h3';
import type { GitHubUser, GitHubEmail, GitHubTokenResponse } from '~/server/types/github';

export const registerUser = async (
  event: H3Event,
  username: string,
  email: string,
  password: string
): Promise<ApiResponse<{ register: boolean }>> => {
  try {
    const config = useRuntimeConfig();
    const user = new User({ username, email, password });
    await sseManager.broadcastUserStatusUpdate(user._id.toString(), { isOnline: false, isGame: false });
    await user.save();

    return { data: { register: true }, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
};

export const loginUser = async (event: H3Event, email: string, password: string): Promise<ApiResponse<AuthData>> => {
  const config = useRuntimeConfig();

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return { data: null, error: 'Invalid email or password' };
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return { data: null, error: 'Invalid email or password' };
    }

    user.isOnline = true;

    await sseManager.broadcastUserStatusUpdate(user._id.toString(), { isOnline: true, isGame: false });
    await user.save();
    const jwtSecret = config.jwtSecret! || process.env.JWT_SECRET!;
    const token = jwt.sign({ userId: user._id.toString() }, jwtSecret, { expiresIn: '30d' });

    setCookie(event, 'auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return { data: { user: user.toObject(), isAuthenticated: true }, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? `Error in loginUser: ${error.message}` : 'An unknown error occurred in loginUser',
    };
  }
};

export async function githubAuth(event: H3Event, code: string): Promise<ApiResponse<AuthData>> {
  const config = useRuntimeConfig();

  try {
    // Получаем access token
    const tokenResponse = await $fetch<GitHubTokenResponse>('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: {
        client_id: config.public.githubClientId,
        client_secret: config.githubClientSecret,
        code,
        redirect_uri: config.public.githubRedirectUri,
      },
    });

    if (tokenResponse.error) {
      throw new Error(tokenResponse.error_description || 'Failed to get access token Github2');
    }

    // Получаем данные пользователя
    const githubUser = await $fetch<GitHubUser>('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenResponse.access_token}`,
      },
    });

    // Получаем email если не предоставлен
    let email = githubUser.email;
    if (!email) {
      const emails = await $fetch<GitHubEmail[]>('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${tokenResponse.access_token}`,
        },
      });
      const primaryEmail = emails.find((e) => e.primary);
      if (!primaryEmail) {
        throw new Error('No primary email found');
      }
      email = primaryEmail.email;
    }

    // Ищем или создаем пользователя
    let user = await User.findOne({ githubId: githubUser.id.toString() });

    if (!user) {
      // Проверяем существование email
      user = await User.findOne({ email });

      if (user) {
        // Связываем существующего пользователя с GitHub
        Object.assign(user, {
          githubId: githubUser.id.toString(),
          githubAccessToken: tokenResponse.access_token,
          githubData: {
            login: githubUser.login,
            avatar_url: githubUser.avatar_url,
            html_url: githubUser.html_url,
            name: githubUser.name,
            bio: githubUser.bio,
            location: githubUser.location,
          },
        });
      } else {
        // Создаем нового пользователя
        user = new User({
          username: githubUser.login,
          email,
          githubId: githubUser.id.toString(),
          githubAccessToken: tokenResponse.access_token,
          githubData: {
            login: githubUser.login,
            avatar_url: githubUser.avatar_url,
            html_url: githubUser.html_url,
            name: githubUser.name,
            bio: githubUser.bio,
            location: githubUser.location,
          },
        });
      }
      await user.save();
    }

    // Обновляем last login и создаем JWT
    user.lastLogin = new Date();
    user.isOnline = true;
    await user.save();

    const token = jwt.sign({ userId: user._id }, config.jwtSecret, { expiresIn: '30d' });

    setCookie(event, 'auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
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
    console.error('GitHub auth error:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to authenticate with GitHub',
    };
  }
}

export const logoutUser = async (event: H3Event, userId: string): Promise<ApiResponse<{ message: string }>> => {
  try {
    await User.findByIdAndUpdate(userId, { isOnline: false });
    await sseManager.broadcastUserStatusUpdate(userId, { isOnline: false, isGame: false });

    deleteCookie(event, 'auth_token', {
      path: '/',
    });

    return { data: { message: 'Logout successful' }, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
};
