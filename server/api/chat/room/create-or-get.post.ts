// /server/api/chat/room/create-or-get.post.ts
import { roomService } from '~/server/services/chat/room.service';

export default defineEventHandler(async (event) => {
  const { recipientId, recipientUsername, recipientChatSetting, username, chatSetting } = await readBody(event);
  const userId = event.context.auth?.userId;

  if (!recipientId || !userId || !username || !recipientUsername || !chatSetting || !recipientChatSetting) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required data',
    });
  }

  try {
    const response = await roomService.createOrGetRoom({
      userId,
      username,
      chatSetting,
      recipientId,
      recipientUsername,
      recipientChatSetting,
    });
    return response;
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to create room',
    });
  }
});
