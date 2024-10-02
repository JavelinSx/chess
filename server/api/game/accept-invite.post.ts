import { GameService } from '~/server/services/game.service';
import { UserService } from '~/server/services/user.service';
import { sseManager } from '~/server/utils/SSEManager';

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

    // Назначаем цвета игрокам случайным образом
    const isWhite = Math.random() < 0.5;
    await GameService.setPlayerColor(game.id, inviterId, isWhite ? 'white' : 'black');
    await GameService.setPlayerColor(game.id, inviteeId, isWhite ? 'black' : 'white');

    await GameService.updateGameStatus(game.id, 'active');

    const updatedGameResponse = await GameService.getGame(game.id);
    if (!updatedGameResponse.data) {
      throw new Error(updatedGameResponse.error || 'Failed to get updated game');
    }

    const updatedGame = updatedGameResponse.data;

    if (updatedGame.players.white && updatedGame.players.black) {
      await UserService.updateUserStatus(updatedGame.players.white, true, true);
      await UserService.updateUserStatus(updatedGame.players.black, true, true);
    }

    // Отправляем уведомление о начале игры через пользовательский SSE канал
    await sseManager.sendGameStartNotification(game.id, [inviterId, inviteeId]);

    return { data: { gameId: game.id }, error: null };
  } catch (error) {
    console.error('Error accepting game invitation:', error);
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'An unknown error occurred',
    });
  }
});
