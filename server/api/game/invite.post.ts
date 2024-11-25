import { UserService } from '~/server/services/user.service';
import type { GameDuration } from '~/server/types/game';
import { invitationSSEManager } from '../../utils/sseManager/InvitationSSEManager';
// invite.ts
export default defineEventHandler(async (event) => {
  const { toInviteId, gameDuration } = await readBody<{ toInviteId: string; gameDuration: GameDuration }>(event);
  const fromInviteId = event.context.auth?.userId;

  if (!fromInviteId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  try {
    const inviter = await UserService.getUserById(fromInviteId);
    if (!inviter || !inviter.data) {
      throw new Error('Inviter not found');
    }

    await invitationSSEManager.sendGameInvitation(fromInviteId, toInviteId, inviter.data.username, gameDuration);

    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('Failed to send game invitation:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send game invitation',
    });
  }
});
