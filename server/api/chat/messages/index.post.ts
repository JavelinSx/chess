// server/api/chat/messages/index.post.ts
import { defineEventHandler, readBody } from 'h3';
import chatModel from '~/server/db/models/chat.model';
import chatRoomModel from '~/server/db/models/chatRoom.model';

export default defineEventHandler(async (event) => {
  const { senderId, receiverId, content } = await readBody(event);

  if (!senderId || !receiverId || !content) {
    return { data: null, error: 'Sender ID, receiver ID, and content are required' };
  }

  try {
    const newMessage = new chatModel({
      sender: senderId,
      receiver: receiverId,
      content,
    });
    await newMessage.save();

    await chatRoomModel.findOneAndUpdate(
      { participants: { $all: [senderId, receiverId] } },
      {
        $set: { lastMessage: newMessage._id },
        $inc: { unreadCount: 1 },
      },
      { upsert: true }
    );

    return { data: newMessage.toObject(), error: null };
  } catch (error) {
    console.error('Error sending message:', error);
    return { data: null, error: 'Failed to send message' };
  }
});
