import { defineEventHandler } from 'h3';
import jwt from 'jsonwebtoken';
import User from '~/server/db/models/user.model';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const token = getCookie(event, 'auth_token');

  if (!token) {
    return { isAuthenticated: false };
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
    const user = await User.findById(decoded.userId).select('-password -githubAccessToken');

    if (!user) {
      return { isAuthenticated: false };
    }

    return {
      isAuthenticated: true,
      user: user.toObject(),
    };
  } catch (error) {
    console.error('JWT verification error:', error);
    return { isAuthenticated: false };
  }
});
