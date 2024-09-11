import { defineEventHandler } from 'h3';
import chatRoomModel from '~/server/db/models/chatRoom.model';

export default defineEventHandler(async (event) => {
  console.log('Received request for chat rooms');
  const query = getQuery(event);
  const userId = query.userId as string;

  console.log('User ID:', userId);

  if (!userId) {
    console.log('User ID is missing');
    return { data: null, error: 'User ID is required' };
  }

  try {
    console.log('Fetching chat rooms from database');
    const chatRooms = await chatRoomModel
      .find({ participants: userId })
      .populate('lastMessage')
      .populate('participants', 'username')
      .lean();

    console.log('Fetched chat rooms:', chatRooms);

    const formattedChatRooms = chatRooms.map((room) => ({
      ...room,
      id: room._id.toString(),
      _id: undefined,
    }));

    console.log('Formatted chat rooms:', formattedChatRooms);

    return { data: formattedChatRooms, error: null };
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    return { data: null, error: 'Failed to fetch chat rooms' };
  }
});
