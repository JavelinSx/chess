import { getUsersList } from '~/server/services/user.service';
import type { ApiResponse } from '~/server/types/auth';
import type { IUser } from '~/server/types/user';

export default defineEventHandler(async () => {
  try {
    const users = await getUsersList();
    return {
      data: users,
      error: null,
    } as ApiResponse<IUser[]>;
  } catch (error: unknown) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    } as ApiResponse<IUser[]>;
  }
});
