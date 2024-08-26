// server/utils/GameSSEManager.ts
import { H3Event } from 'h3';
import type { ChessGame } from '~/entities/game/model/game.model';
import type { GameResult } from '../types/game';
import { updateUserStatus } from '~/server/services/user.service';
import { getGameFromDatabase } from '../services/game.service';
export class GameSSEManager {
  private gameConnections: Map<string, Map<string, H3Event>> = new Map();

  addGameConnection(gameId: string, userId: string, event: H3Event) {
    if (!this.gameConnections.has(gameId)) {
      this.gameConnections.set(gameId, new Map());
    }
    this.gameConnections.get(gameId)!.set(userId, event);
  }

  removeGameConnection(gameId: string, userId: string) {
    const gameClients = this.gameConnections.get(gameId);
    if (gameClients) {
      gameClients.delete(userId);
      if (gameClients.size === 0) {
        this.gameConnections.delete(gameId);
      }
    }
  }

  async broadcastGameUpdate(gameId: string, gameState: ChessGame) {
    const clients = this.gameConnections.get(gameId);
    if (clients) {
      const message = JSON.stringify({
        type: 'game_update',
        game: gameState,
      });
      for (const event of clients.values()) {
        await this.sendEvent(event, message);
      }
    }
  }

  async sendGameEndNotification(gameId: string, result: GameResult) {
    const clients = this.gameConnections.get(gameId);
    if (clients) {
      const message = JSON.stringify({
        type: 'game_end',
        result,
      });

      try {
        const game = await getGameFromDatabase(gameId);

        if (game && game.players.white && game.players.black) {
          await Promise.all([
            updateUserStatus(game.players.white, true, false),
            updateUserStatus(game.players.black, true, false),
          ]);
        } else {
          console.error(`Game with id ${gameId} not found`);
        }
      } catch (error) {
        console.error(`Error updating user statuses for game ${gameId}:`, error);
      }

      for (const event of clients.values()) {
        await this.sendEvent(event, message);
      }
    }
  }

  private async sendEvent(event: H3Event, data: string) {
    await event.node.res.write(`data: ${data}\n\n`);
  }
}
