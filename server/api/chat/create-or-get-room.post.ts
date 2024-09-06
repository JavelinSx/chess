import { chatService } from '~/server/services/chat.service';

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
    return { room: room.toObject() };
  } catch (error) {
    console.error('Error creating or getting room:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});
