// server/api/chat/messages/[roomId]/index.get.ts
import { defineEventHandler } from 'h3';
import chatModel from '~/server/db/models/chat.model';
import chatRoomModel from '~/server/db/models/chatRoom.model';
import mongoose from 'mongoose';

export default defineEventHandler(async (event) => {
  const roomId = event.context.params?.roomId;
  if (!roomId) {
    console.log('Room ID is missing in the request');
    return { data: null, error: 'Room ID is required' };
  }

  console.log(`Received request for messages in room: ${roomId}`);

  try {
    const objectId = new mongoose.Types.ObjectId(roomId);
    const room = await chatRoomModel.findById(objectId);

    if (!room) {
      console.log(`Chat room not found for ID: ${roomId}`);
      return { data: null, error: 'Chat room not found' };
    }

    const messages = await chatModel
      .find({
        $or: [
          { sender: { $in: room.participants }, receiver: { $in: room.participants } },
          { receiver: { $in: room.participants }, sender: { $in: room.participants } },
        ],
      })
      .sort({ timestamp: 1 });

    console.log(`Found ${messages.length} messages for room: ${roomId}`);

    return {
      data: messages.map((msg) => ({
        id: msg._id.toString(),
        roomId: room._id.toString(),
        senderId: msg.sender.toString(),
        receiverId: msg.receiver.toString(),
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
        status: msg.status,
        isEdited: msg.isEdited,
      })),
      error: null,
    };
  } catch (error) {
    console.error('Error fetching messages:', error);
    return { data: null, error: 'Failed to fetch messages' };
  }
});
