import { defineEventHandler, readBody, H3Event } from 'h3';
import jwt from 'jsonwebtoken';
import type { ApiResponse } from '~/server/types/api';
import type { AuthData } from '~/server/types/auth';
import User from '~/server/db/models/user.model';
import type { GitHubTokenResponse, GitHubEmail, GitHubUser } from '~/server/types/github';

export default defineEventHandler(async (event: H3Event): Promise<ApiResponse<AuthData>> => {
  const { code } = await readBody<{ code: string }>(event);

  if (!code) {
    throw createError({
      statusCode: 400,
      message: 'Code is required',
    });
  }

  const config = useRuntimeConfig();

  try {
    // Получаем token
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
      },
    });

    if (tokenResponse.error) {
      throw new Error(tokenResponse.error_description || 'Failed to get access token Github');
    }

    // Получаем данные пользователя
    const [githubUser, emails] = await Promise.all([
      $fetch<GitHubUser>('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      }),
      $fetch<GitHubEmail[]>('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      }),
    ]);

    const email = githubUser.email || emails.find((e) => e.primary)?.email;
    if (!email) throw new Error('No email found');

    // Ищем или создаем пользователя
    let user = await User.findOne({
      $or: [{ githubId: githubUser.id.toString() }, { email }],
    });

    const githubData = {
      login: githubUser.login,
      avatar_url: githubUser.avatar_url,
      html_url: githubUser.html_url,
      name: githubUser.name,
      bio: githubUser.bio,
      location: githubUser.location,
    };

    if (!user) {
      user = new User({
        username: githubUser.login,
        email,
        githubId: githubUser.id.toString(),
        githubAccessToken: tokenResponse.access_token,
        githubData,
      });
    } else {
      user.githubId = githubUser.id.toString();
      user.githubAccessToken = tokenResponse.access_token;
      user.githubData = githubData;
    }

    user.lastLogin = new Date();
    user.isOnline = true;
    await user.save();

    // Создаем JWT
    const token = jwt.sign({ userId: user._id.toString() }, config.jwtSecret as string, { expiresIn: '30d' });

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
    console.error('GitHub auth error:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
});
