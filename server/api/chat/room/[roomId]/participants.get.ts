// server/api/chat/room/[roomId]/participants.get.ts
import { roomService } from '~/server/services/chat/room.service';

export default defineEventHandler(async (event) => {
  const roomId = event.context.params?.roomId;

  if (!roomId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Room ID is required',
    });
  }

  try {
    const response = await roomService.getParticipants(roomId);
    return response;
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to get participants',
    });
  }
});
