import { roomService } from '~/server/services/chat/room.service';

export default defineEventHandler(async (event) => {
  const {
    userId,
    username,
    userChatSetting,
    userAvatar,
    recipientId,
    recipientUsername,
    recipientChatSetting,
    recipientAvatar,
  } = await readBody(event);

  if (!userId || !recipientId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required user IDs',
    });
  }

  try {
    const response = await roomService.createOrGetRoom({
      userId,
      username,
      userChatSetting,
      userAvatar,
      recipientId,
      recipientUsername,
      recipientChatSetting,
      recipientAvatar,
    });

    return response;
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to create or get room',
    });
  }
});
