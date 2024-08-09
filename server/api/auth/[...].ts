import type { ApiResponse, AuthData } from '~/server/types/auth';
import { registerUser, loginUser, logoutUser } from '~/server/services/auth.service';
export default defineEventHandler(async (event) => {
  const { method, url } = event.node.req;

  if (method === 'POST' && url === '/api/auth/register') {
    const { username, email, password } = await readBody(event);
    return await registerUser(username, email, password);
  }

  if (method === 'POST' && url === '/api/auth/login') {
    const { email, password } = await readBody(event);
    return await loginUser(email, password);
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
