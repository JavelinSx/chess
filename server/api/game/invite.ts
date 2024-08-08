// server/api/game/invite.ts

import { sseManager } from '~/server/utils/SSEManager';
import { getUserById } from '~/server/services/user.service';

export default defineEventHandler(async (event) => {
  const { toInviteId } = await readBody(event);
  const fromInviteId = event.context.auth?.userId;

  if (!fromInviteId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  try {
    const inviter = await getUserById(fromInviteId);
    if (!inviter) {
      throw new Error('Inviter not found');
    }

    await sseManager.sendGameInvitation(fromInviteId, toInviteId, inviter.username);
    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('Error sending game invitation:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send game invitation',
    });
  }
});
