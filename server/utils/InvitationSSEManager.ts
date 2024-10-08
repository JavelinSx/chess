import { H3Event } from 'h3';
import { GameService } from '../services/game.service';
import { UserService } from '../services/user.service';
import type { GameDuration } from '../types/game';

export class InvitationSSEManager {
  private invitationConnections: Map<string, H3Event> = new Map();
  private invitationTimers: Map<string, NodeJS.Timeout> = new Map();

  addInvitationConnection(userId: string, event: H3Event) {
    this.invitationConnections.set(userId, event);
  }

  removeInvitationConnection(userId: string) {
    this.invitationConnections.delete(userId);
    this.clearInvitationTimer(userId);
  }

  async sendGameInvitation(fromUserId: string, toUserId: string, fromUsername: string, gameDuration: GameDuration) {
    const event = this.invitationConnections.get(toUserId);
    if (event) {
      const message = JSON.stringify({
        type: 'game_invitation',
        fromInviteId: fromUserId,
        fromInviteName: fromUsername,
        gameDuration,
      });
      await this.sendEvent(event, message);

      this.setInvitationTimer(toUserId, fromUserId);
    }
  }

  private setInvitationTimer(toUserId: string, fromUserId: string) {
    this.clearInvitationTimer(toUserId);
    const timer = setTimeout(async () => {
      await this.expireInvitation(toUserId, fromUserId);
    }, 15000);
    this.invitationTimers.set(toUserId, timer);
  }

  private clearInvitationTimer(userId: string) {
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
            UserService.updateUserStatus(gameResponse.data.players.white, true, true),
            UserService.updateUserStatus(gameResponse.data.players.black, true, true),
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

  private async sendEvent(event: H3Event, data: string) {
    try {
      await event.node.res.write(`data: ${data}\n\n`);
    } catch (error) {
      console.error('Error sending invitation SSE event:', error);
    }
  }
}
