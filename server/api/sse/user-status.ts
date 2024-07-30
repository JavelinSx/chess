import { H3Event } from 'h3';
import { updateUserStatus, getUserById } from '~/server/services/user.service';

const clients = new Map<string, H3Event>();

export default defineEventHandler(async (event) => {
  const userId = event.context.auth?.userId;
  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  setHeader(event, 'Content-Type', 'text/event-stream');
  setHeader(event, 'Cache-Control', 'no-cache');
  setHeader(event, 'Connection', 'keep-alive');

  clients.set(userId, event);

  await sendEvent(event, JSON.stringify({ type: 'connected' }));

  const closeHandler = () => {
    clients.delete(userId);
    updateUserStatus(userId, false, false).then(() => {
      broadcastStatusUpdate(userId, false, false);
    });
  };

  event.node.req.on('close', closeHandler);

  return new Promise(() => {});
});

export const sendStatusUpdate = async (userId: string, isOnline: boolean, isGame: boolean) => {
  console.log('Starting sendStatusUpdate');
  try {
    await updateUserStatus(userId, isOnline, isGame);
    console.log('Status update completed');
    await broadcastStatusUpdate(userId, isOnline, isGame);
  } catch (error) {
    console.error('Error in sendStatusUpdate:', error);
  }
};

export const sendGameInvitation = async (fromInviteId: string, toInviteId: string) => {
  const inviter = await getUserById(fromInviteId);
  if (!inviter) {
    throw new Error('Inviter not found');
  }

  const message = JSON.stringify({
    type: 'game_invitation',
    fromInviteId,
    fromInviteName: inviter.username,
  });

  const inviteeEvent = clients.get(toInviteId);
  if (inviteeEvent) {
    await sendEvent(inviteeEvent, message);
  } else {
    throw new Error('Invitee not connected');
  }
};

async function broadcastStatusUpdate(userId: string, isOnline: boolean, isGame: boolean) {
  const user = await getUserById(userId);
  if (!user) {
    console.error('User not found for status update');
    return;
  }

  const message = JSON.stringify({
    type: 'status_update',
    userId,
    username: user.username,
    isOnline,
    isGame,
  });

  for (const [clientId, clientEvent] of clients) {
    if (clientId !== userId) {
      await sendEvent(clientEvent, message);
    }
  }
}

async function sendEvent(event: H3Event, data: string) {
  await event.node.res.write(`data: ${data}\n\n`);
}

export async function sendMessageToUsers(userIds: string[], message: string) {
  for (const userId of userIds) {
    const clientEvent = clients.get(userId);
    if (clientEvent) {
      await sendEvent(clientEvent, message);
    }
  }
}
