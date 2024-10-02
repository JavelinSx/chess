import { H3Event } from 'h3';
import type { ChessGame } from '../types/game';
import type { GameResult } from '../types/game';
import { UserService } from '../services/user.service';
import { GameService } from '../services/game.service';

export class GameSSEManager {
  private gameConnections: Map<string, Map<string, H3Event>> = new Map();

  addGameConnection(gameId: string, userId: string, event: H3Event) {
    if (!this.gameConnections.has(gameId)) {
      this.gameConnections.set(gameId, new Map());
    }
    this.gameConnections.get(gameId)!.set(userId, event);
    console.log(this.gameConnections);
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
      await this.broadcastToClients(clients, message);
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
        const gameResponse = await GameService.getGame(gameId);

        if (gameResponse.data && gameResponse.data.players.white && gameResponse.data.players.black) {
          await Promise.all([
            UserService.updateUserStatus(gameResponse.data.players.white, true, false),
            UserService.updateUserStatus(gameResponse.data.players.black, true, false),
          ]);
        } else {
          console.error(`Game with id ${gameId} not found or has invalid player data`);
        }
      } catch (error) {
        console.error(`Error updating user statuses for game ${gameId}:`, error);
      }

      await this.broadcastToClients(clients, message);
    }
  }

  private async broadcastToClients(clients: Map<string, H3Event>, message: string) {
    const sendPromises = Array.from(clients.values()).map((event) =>
      this.sendEvent(event, message).catch((error) => console.error('Error sending SSE event:', error))
    );
    await Promise.all(sendPromises);
  }

  private async sendEvent(event: H3Event, data: string) {
    try {
      await event.node.res.write(`data: ${data}\n\n`);
    } catch (error) {
      console.error('Error writing SSE event:', error);
      throw error; // Re-throw to be caught in broadcastToClients
    }
  }
}
