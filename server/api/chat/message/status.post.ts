// server/api/chat/message/status.post.ts
import { messageService } from '~/server/services/chat/message.service';
import { MessageStatus } from '~/server/services/chat/types';

export default defineEventHandler(async (event) => {
  const { roomId, messageId, status } = await readBody(event);

  if (!roomId || !messageId || !status) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required status update data',
    });
  }

  try {
    const response = await messageService.updateStatus(roomId, messageId, status as MessageStatus);
    return response;
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to update message status',
    });
  }
});
