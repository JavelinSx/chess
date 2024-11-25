import { invitationSSEManager } from '~/server/utils/sseManager/InvitationSSEManager';

export default defineEventHandler(async (event) => {
  const userId = event.context.auth?.userId;
  invitationSSEManager.clearInvitationTimer(userId);
});
