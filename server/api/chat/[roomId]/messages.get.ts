// server/api/chat/room/[roomId]/messages.get.ts
import { chatService } from '~/server/services/chat.service';

export default defineEventHandler(async (event) => {
  const userId = event.context.auth?.userId;
  const roomId = event.context.params?.roomId;

  if (!userId || !roomId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields',
    });
  }

  try {
    const room = await chatService.getRoom(roomId);
    if (!room) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Room not found',
      });
    }

    // Проверяем, является ли пользователь участником комнаты
    if (!room.participants.some((participant) => participant.userId === userId)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access denied',
      });
    }

    const messages = await chatService.getRoomMessages(roomId);
    return { messages };
  } catch (error) {
    console.error('Error fetching room messages:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});
