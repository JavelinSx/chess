import { sseManager } from '~/server/utils/SSEManager';
import { UserService } from '~/server/services/user.service';
import type { GameDuration } from '~/server/types/game';

export default defineEventHandler(async (event) => {
  const { toInviteId, gameDuration } = await readBody<{ toInviteId: string; gameDuration: GameDuration }>(event);
  const fromInviteId = event.context.auth?.userId;

  if (!fromInviteId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  console.log(`Processing invitation request from ${fromInviteId} to ${toInviteId}`);

  try {
    const inviter = await UserService.getUserById(fromInviteId);
    if (!inviter || !inviter.data) {
      throw new Error('Inviter not found');
    }

    await sseManager.sendGameInvitation(fromInviteId, toInviteId, inviter.data.username, gameDuration);
    console.log(`Game invitation sent successfully from ${fromInviteId} to ${toInviteId}`);

    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('Error sending game invitation:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send game invitation',
    });
  }
});
