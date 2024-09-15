import { chatService } from '~/server/services/chat.service';

// server/api/chat/create-or-get-room.post.ts
export default defineEventHandler(async (event) => {
  const { currentUser, otherUser } = await readBody(event);

  if (!currentUser || !otherUser || !currentUser._id || !otherUser._id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing or invalid user information',
    });
  }

  try {
    const room = await chatService.createOrGetRoom(
      { _id: currentUser._id, username: currentUser.username },
      { _id: otherUser._id, username: otherUser.username }
    );

    if (!room) {
      return {
        statusCode: 403,
        body: { message: 'Chat creation is not allowed due to user settings' },
      };
    }

    return { room };
  } catch (error) {
    console.error('Error creating or getting room:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});
