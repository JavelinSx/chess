// ~/server/api/chat/send-message.post.ts
import { H3Error } from 'h3';
import { ChatService } from '~/server/services/chat.service';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { roomId, content, _id, username, chatSetting } = body;

  if (!roomId || !content || !_id || !username || !chatSetting) {
    console.error('Missing fields:', { roomId, content, _id, username, chatSetting });
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields',
    });
  }

  try {
    const result = await ChatService.addMessage(roomId, { _id, username, chatSetting }, content);

    if (result.error) {
      console.error('Error sending message:', result.error);
      throw createError({
        statusCode: result.error.includes('privacy settings') ? 403 : 500,
        statusMessage: result.error,
      });
    }

    if (result.data && result.data.success) {
      return { data: result.data.chatMessage, error: null };
    } else {
      throw createError({
        statusCode: 500,
        statusMessage: result.data ? result.data.message : 'Failed to send message',
      });
    }
  } catch (error) {
    console.error('Error in send-message handler:', error);

    if (error instanceof H3Error) {
      throw error;
    } else {
      throw createError({
        statusCode: 500,
        statusMessage: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }
});
