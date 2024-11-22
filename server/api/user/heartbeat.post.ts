// server/api/user/heartbeat.post.ts
import { UserActivityService } from '~/server/services/user-activity.service';
import { chatSSEManager } from '~/server/utils/sseManager/ChatSSEManager';
import { friendsSSEManager } from '~/server/utils/sseManager/FriendsSSEManager';
import { invitationSSEManager } from '~/server/utils/sseManager/InvitationSSEManager';
import { userSSEManager } from '~/server/utils/sseManager/UserSSEManager';
export default defineEventHandler(async (event) => {
  const userId = event.context.auth?.userId;
  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }
  try {
    await UserActivityService.updateUserActivity(userId);
    return { status: 'success' };
  } catch (error) {
    console.error('Error updating offline status:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update user activity',
    });
  }
});
