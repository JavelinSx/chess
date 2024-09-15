// server/utils/InvitationSSEManager.ts
import { H3Event } from 'h3';
import { GameService } from '../services/game.service';
import { updateUserStatus } from '../services/user.service';
export class InvitationSSEManager {
  private invitationConnections: Map<string, H3Event> = new Map();

  addInvitationConnection(userId: string, event: H3Event) {
    this.invitationConnections.set(userId, event);
  }

  removeInvitationConnection(userId: string) {
    this.invitationConnections.delete(userId);
  }

  async sendGameInvitation(fromUserId: string, toUserId: string, fromUsername: string) {
    const event = this.invitationConnections.get(toUserId);
    if (event) {
      await this.sendEvent(
        event,
        JSON.stringify({
          type: 'game_invitation',
          fromInviteId: fromUserId,
          fromInviteName: fromUsername,
        })
      );
    }
  }

  async sendGameStartNotification(gameId: string, playerIds: string[]) {
    const message = JSON.stringify({
      type: 'game_start',
      gameId,
    });

    for (const playerId of playerIds) {
      const event = this.invitationConnections.get(playerId);
      try {
        const game = await GameService.getGame(gameId);

        if (game && game.players.white && game.players.black) {
          await Promise.all([
            updateUserStatus(game.players.white, true, true),
            updateUserStatus(game.players.black, true, true),
          ]);
        } else {
          console.error(`Game with id ${gameId} not found`);
        }
      } catch (error) {
        console.error(`Error updating user statuses for game ${gameId}:`, error);
      }
      if (event) {
        await this.sendEvent(event, message);
      }
    }
  }

  private async sendEvent(event: H3Event, data: string) {
    await event.node.res.write(`data: ${data}\n\n`);
  }
}
