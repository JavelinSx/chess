// server/api/chat/messages/[roomId]/read.post.ts
import { defineEventHandler } from 'h3';
import chatRoomModel from '~/server/db/models/chatRoom.model';
import chatModel from '~/server/db/models/chat.model';

export default defineEventHandler(async (event) => {
  const roomId = event.context.params?.roomId;
  const userId = event.context.auth?.userId;

  if (!roomId || !userId) {
    return { data: null, error: 'Room ID and user ID are required' };
  }

  try {
    const room = await chatRoomModel.findById(roomId);
    if (!room) {
      return { data: null, error: 'Chat room not found' };
    }

    // Обновляем статус всех сообщений в комнате для данного пользователя
    await chatModel.updateMany({ receiver: userId, status: { $ne: 'read' } }, { $set: { status: 'read' } });

    // Сбрасываем счетчик непрочитанных сообщений
    room.unreadCount = 0;
    await room.save();

    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return { data: null, error: 'Failed to mark messages as read' };
  }
});
