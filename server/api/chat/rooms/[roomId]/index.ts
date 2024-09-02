// server/api/chat/rooms/[roomId].delete.ts
import { defineEventHandler } from 'h3';
import chatRoomModel from '~/server/db/models/chatRoom.model';
import chatModel from '~/server/db/models/chat.model';

export default defineEventHandler(async (event) => {
  const roomId = event.context.params?.roomId;

  if (!roomId) {
    return { data: null, error: 'Room ID is required' };
  }

  try {
    const room = await chatRoomModel.findByIdAndDelete(roomId);
    if (!room) {
      return { data: null, error: 'Chat room not found' };
    }

    // Удаляем все сообщения, связанные с этой комнатой
    await chatModel.deleteMany({
      $or: [
        { sender: { $in: room.participants }, receiver: { $in: room.participants } },
        { receiver: { $in: room.participants }, sender: { $in: room.participants } },
      ],
    });

    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('Error deleting chat room:', error);
    return { data: null, error: 'Failed to delete chat room' };
  }
});
