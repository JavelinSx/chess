// server/api/sse/invitations.ts

import { invitationSSEManager } from '~/server/utils/sseManager/InvitationSSEManager';

export default defineEventHandler(async (event) => {
  const userId = event.context.auth?.userId;
  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  setHeader(event, 'Content-Type', 'text/event-stream');
  setHeader(event, 'Cache-Control', 'no-cache');
  setHeader(event, 'Connection', 'keep-alive');

  await invitationSSEManager.addInvitationConnection(userId, event);

  const closeHandler = async () => {
    await invitationSSEManager.removeInvitationConnection(userId);
  };

  event.node.req.on('close', closeHandler);

  return new Promise(() => {});
});
