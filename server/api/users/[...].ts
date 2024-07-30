import { profileUpdate } from '~/server/services/user.service';
import type { ApiResponse } from '~/server/types/auth';
import type { UserProfileResponse } from '~/server/types/user';

export default defineEventHandler(async (event) => {
  const { method, url } = event.node.req;

  if (method === 'POST' && url === '/api/users/update-profile') {
    const { id, username, email } = await readBody(event);
    try {
      const profileResponse = await profileUpdate(id, username, email);
      return {
        data: profileResponse,
        error: null,
      } as ApiResponse<UserProfileResponse>;
    } catch (error: unknown) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      } as ApiResponse<UserProfileResponse>;
    }
  }
  throw createError({
    statusCode: 404,
    statusMessage: 'Not Found',
  });
});
