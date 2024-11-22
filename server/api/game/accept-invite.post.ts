import { defineEventHandler, readBody } from 'h3';
import { GameService } from '~/server/services/game.service';
import { UserService } from '~/server/services/user.service';
import { invitationSSEManager } from '../../utils/sseManager/InvitationSSEManager';

export default defineEventHandler(async (event) => {
  const { inviterId, timeControl } = await readBody(event);
  const inviteeId = event.context.auth?.userId;

  if (!inviteeId || !inviterId || !timeControl) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request',
    });
  }

  try {
    const gameResponse = await GameService.createGame(inviterId, inviteeId, timeControl);
    if (!gameResponse.data) {
      throw new Error(gameResponse.error || 'Failed to create game');
    }

    const game = gameResponse.data;

    await GameService.updateGameStatus(game._id.toString(), 'active');
    const updatedGameResponse = await GameService.getGame(game._id.toString());

    if (!updatedGameResponse.data) {
      throw new Error(updatedGameResponse.error || 'Failed to get updated game');
    }

    const updatedGame = updatedGameResponse.data;

    if (updatedGame.players.white && updatedGame.players.black) {
      await UserService.updateUserStatus(updatedGame.players.white, true, true);
      await UserService.updateUserStatus(updatedGame.players.black, true, true);
    }

    // Отправляем уведомление о начале игры через пользовательский SSE канал
    await invitationSSEManager.sendGameStartNotification(game._id.toString(), [inviterId, inviteeId]);

    return { data: { gameId: game._id.toString() }, error: null };
  } catch (error) {
    console.error('Error accepting game invitation:', error);
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'An unknown error occurred',
    });
  }
});
