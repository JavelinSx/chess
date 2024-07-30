import { sendGameInvitation } from '~/server/api/sse/user-status';

export default defineEventHandler(async (event) => {
  const { toInviteId } = await readBody(event);
  const fromInviteId = event.context.auth?.userId;

  if (!fromInviteId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  await sendGameInvitation(fromInviteId, toInviteId);

  return { data: { success: true }, error: null };
});
