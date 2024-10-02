import type { ApiResponse } from '~/server/types/api';
import { registerUser, loginUser, logoutUser } from '~/server/services/auth.service';

import { z } from 'zod';
import { registerSchema, loginSchema } from '~/server/schemas/auth.schema';

export default defineEventHandler(async (event) => {
  const { method, url } = event.node.req;

  if (method === 'POST' && url === '/api/auth/register') {
    const body = await readBody(event);
    try {
      const validatedData = registerSchema.parse(body);
      return await registerUser(validatedData.username, validatedData.email, validatedData.password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw createError({
          statusCode: 400,
          statusMessage: error.errors.map((e) => e.message).join(', '),
        });
      }
      throw error;
    }
  }

  if (method === 'POST' && url === '/api/auth/login') {
    const body = await readBody(event);
    try {
      const validatedData = loginSchema.parse(body);
      return await loginUser(validatedData.email, validatedData.password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw createError({
          statusCode: 400,
          statusMessage: error.errors.map((e) => e.message).join(', '),
        });
      }
      throw error;
    }
  }

  if (method === 'POST' && url === '/api/auth/logout') {
    const userId = event.context.auth?.userId;
    if (!userId) {
      return { data: null, error: 'User not authenticated' } as ApiResponse<{ message: string }>;
    }
    return await logoutUser(userId);
  }

  throw createError({
    statusCode: 404,
    statusMessage: 'Not Found',
  });
});
