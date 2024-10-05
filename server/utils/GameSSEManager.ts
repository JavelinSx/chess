import { H3Event } from 'h3';
import type { ChessGame } from '../types/game';
import type { GameResult } from '../types/game';

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
    console.log(clients);
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
      await this.broadcastToClients(clients, message);
    } else {
      console.warn('No clients found for game:', gameId);
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
      throw error;
    }
  }
}
