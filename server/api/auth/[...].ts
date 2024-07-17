import { registerUser, loginUser } from '../../services/auth.service';
import authMiddleware from '../../middleware/auth';

export default defineEventHandler(async (event) => {
  const { method, url } = event.node.req;

  if (method === 'POST' && url === '/api/auth/register') {
    const { username, email, password } = await readBody(event);
    const user = await registerUser(username, email, password);
    return { message: 'User registered successfully', user };
  }

  if (method === 'POST' && url === '/api/auth/login') {
    const { email, password } = await readBody(event);
    const { user, token } = await loginUser(email, password);
    return { message: 'Login successful', user, token };
  }

  if (method === 'POST' && url === '/api/auth/logout') {
    await authMiddleware(event);
    // Здесь можно добавить логику для инвалидации токена, если это необходимо
    return { message: 'Logout successful' };
  }

  throw createError({
    statusCode: 404,
    statusMessage: 'Not Found',
  });
});
