import { UserService } from '~/server/services/user.service';

export default defineEventHandler(async () => {
  try {
    const response = await UserService.getUsersList();
    return response;
  } catch (error: unknown) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
});
