import { registerUser, loginUser } from '../../services/auth.service';
import authMiddleware from '../../middleware/auth';
import type { ApiResponse, AuthResponse } from '~/server/types/auth';

export default defineEventHandler(async (event) => {
  const { method, url } = event.node.req;

  if (method === 'POST' && url === '/api/auth/register') {
    const { username, email, password } = await readBody(event);
    try {
      const authResponse = await registerUser(username, email, password);
      return { data: authResponse, error: null } as ApiResponse<AuthResponse>;
    } catch (error: unknown) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      } as ApiResponse<AuthResponse>;
    }
  }

  if (method === 'POST' && url === '/api/auth/login') {
    console.log('Login request received');
    const { email, password } = await readBody(event);
    try {
      console.log('Attempting login for:', email);
      const authResponse = await loginUser(email, password);
      console.log('Login successful');
      return { data: authResponse, error: null } as ApiResponse<AuthResponse>;
    } catch (error: unknown) {
      console.error('Login failed:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      } as ApiResponse<AuthResponse>;
    }
  }

  if (method === 'POST' && url === '/api/auth/logout') {
    await authMiddleware(event);
    // Здесь можно добавить логику для инвалидации токена, если это необходимо
    return { data: { message: 'Logout successful' }, error: null };
  }

  throw createError({
    statusCode: 404,
    statusMessage: 'Not Found',
  });
});
