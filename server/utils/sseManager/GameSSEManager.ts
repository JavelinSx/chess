import { H3Event } from 'h3';
import type { ChessGame } from '../../types/game';
import type { GameResult } from '../../types/game';
import GameCache from '../GameCache';
export class GameSSEManager {
  private gameConnections: Map<string, Map<string, H3Event>> = new Map();
  private gameTimer: Map<string, NodeJS.Timeout> = new Map();

  private async setGameTimer(gameId: string) {
    const game = GameCache.get<ChessGame>(gameId);
    if (!game) return;

    this.clearGameTimer(gameId);
    const timer = setInterval(() => {
      if (game.currentTurn === 'white') {
        game.whiteTime--;
      } else {
        game.blackTime--;
      }
    }, 1000);
    this.gameTimer.set(gameId, timer);
  }

  private async clearGameTimer(gameId: string) {
    const timer = this.gameTimer.get(gameId);
    if (timer) {
      clearInterval(timer);
      this.gameTimer.delete(gameId);
    }
  }

  async addGameConnection(gameId: string, userId: string, event: H3Event) {
    if (!this.gameConnections.has(gameId)) {
      this.gameConnections.set(gameId, new Map());
      await this.sendEvent(event, JSON.stringify({ type: 'connection_established', userId }));
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

  async closeGameConnections(gameId: string) {
    const clients = this.gameConnections.get(gameId);
    if (clients) {
      // Отправляем последнее событие о закрытии соединения
      const message = JSON.stringify({
        type: 'game_connection_close',
        gameId,
      });

      await this.broadcastToClients(clients, message);

      // Закрываем все соединения для данной игры
      for (const [userId, connection] of clients.entries()) {
        connection.node.res.end();
        this.removeGameConnection(gameId, userId);
      }

      // Удаляем все соединения для этой игры
      this.gameConnections.delete(gameId);
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
      await this.broadcastToClients(clients, message);
    }
  }

  private async broadcastToClients(clients: Map<string, H3Event>, message: string) {
    const sendPromises = Array.from(clients.values()).map((event) =>
      this.sendEvent(event, message).catch((error) => console.error('Error sending SSE event:', error))
    );
    await Promise.all(sendPromises);
  }

  async broadcastTimerSync(
    gameId: string,
    timerData: {
      whiteTime: number;
      blackTime: number;
      activeColor: string;
      gameId: string;
      status: string;
      timestamp: number;
    }
  ) {
    const clients = this.gameConnections.get(gameId);
    if (clients) {
      const message = JSON.stringify({
        type: 'timer_sync',
        data: timerData,
      });
      await this.broadcastToClients(clients, message);
    }
  }

  async broadcastGameCountdown(gameId: string, countdownTime: number) {
    const clients = this.gameConnections.get(gameId);
    if (clients) {
      const message = JSON.stringify({
        type: 'game_countdown',
        data: { countdownTime },
      });
      await this.broadcastToClients(clients, message);
    }
  }

  async broadcastTimeOut(gameId: string, color: 'white' | 'black') {
    const clients = this.gameConnections.get(gameId);
    if (clients) {
      const message = JSON.stringify({
        type: 'time_out',
        data: { color },
      });
      await this.broadcastToClients(clients, message);
    }
  }

  private async sendEvent(event: H3Event, data: string) {
    try {
      await event.node.res.write(`data: ${data}\n\n`);
    } catch (error) {
      throw error;
    }
  }
}

export const gameSSEManager = new GameSSEManager();
