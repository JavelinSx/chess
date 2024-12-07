import { H3Event } from 'h3';
import { GameService } from '../../services/game.service';
import { UserService } from '../../services/user.service';
import type { GameDuration, StartColor } from '../../types/game';

export class InvitationSSEManager {
  private invitationConnections: Map<string, H3Event> = new Map();
  private invitationTimers: Map<string, NodeJS.Timeout> = new Map();

  async addInvitationConnection(userId: string, event: H3Event) {
    if (this.invitationConnections.get(userId)) {
      // Закрываем старое соединение
      const oldConnection = this.invitationConnections.get(userId);
      oldConnection?.node.res.end();
    }
    this.invitationConnections.set(userId, event);
    await this.sendEvent(event, JSON.stringify({ type: 'connection_established', userId }));
  }

  async removeInvitationConnection(userId: string) {
    this.invitationConnections.delete(userId);
    this.clearInvitationTimer(userId);
  }

  async sendGameInvitation(
    fromUserId: string,
    toUserId: string,
    fromUsername: string,
    gameDuration: GameDuration,
    startColor: StartColor
  ) {
    const event = this.invitationConnections.get(toUserId);

    if (event) {
      const message = JSON.stringify({
        type: 'game_invitation',
        fromInviteId: fromUserId,
        fromInviteName: fromUsername,
        gameDuration,
        startColor,
      });

      try {
        await this.sendEvent(event, message);
      } catch (err) {
        console.error('Error sending invitation:', err);
      }
      this.setInvitationTimer(toUserId, fromUserId);
    } else {
      console.warn('No SSE connection found for user:', toUserId);
    }
  }

  private setInvitationTimer(toUserId: string, fromUserId: string) {
    this.clearInvitationTimer(toUserId);
    const timer = setTimeout(async () => {
      await this.expireInvitation(toUserId, fromUserId);
    }, 15000);
    this.invitationTimers.set(toUserId, timer);
  }

  clearInvitationTimer(userId: string) {
    const timer = this.invitationTimers.get(userId);
    if (timer) {
      clearTimeout(timer);
      this.invitationTimers.delete(userId);
    }
  }

  private async expireInvitation(toUserId: string, fromUserId: string) {
    const toEvent = this.invitationConnections.get(toUserId);
    const fromEvent = this.invitationConnections.get(fromUserId);

    if (toEvent) {
      await this.sendEvent(toEvent, JSON.stringify({ type: 'game_invitation_expired' }));
    }
    if (fromEvent) {
      await this.sendEvent(fromEvent, JSON.stringify({ type: 'game_invitation_expired' }));
    }

    this.clearInvitationTimer(toUserId);
  }

  async sendGameStartNotification(gameId: string, playerIds: string[]) {
    const message = JSON.stringify({
      type: 'game_start',
      gameId,
    });

    for (const playerId of playerIds) {
      const event = this.invitationConnections.get(playerId);
      try {
        const gameResponse = await GameService.getGame(gameId);

        if (gameResponse.data && gameResponse.data.players.white && gameResponse.data.players.black) {
          await Promise.all([
            UserService.updateUserStatus(gameResponse.data.players.white._id, true, true),
            UserService.updateUserStatus(gameResponse.data.players.black._id, true, true),
          ]);
        } else {
          console.error(`Game with id ${gameId} not found or has invalid player data`);
        }
      } catch (error) {
        console.error(`Error updating user statuses for game ${gameId}:`, error);
      }
      if (event) {
        await this.sendEvent(event, message);
      }
    }

    // Clear invitation timers for both players
    playerIds.forEach((playerId) => this.clearInvitationTimer(playerId));
  }

  private async sendEvent(event: H3Event, data: string, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
      try {
        await event.node.res.write(`data: ${data}\n\n`);
        return;
      } catch (error: any) {
        // Указываем тип any для error
        if (error.code === 'EBUSY' && i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
  }
}
export const invitationSSEManager = new InvitationSSEManager();
