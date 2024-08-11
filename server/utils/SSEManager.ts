// server/utils/SSEManager.ts
import { H3Event } from 'h3';
import { UserSSEManager } from './UserSSEManager';
import type { UserStatus } from './UserSSEManager';
import { InvitationSSEManager } from './InvitationSSEManager';
import { GameSSEManager } from './GameSSEManager';
import type { GameResult } from '../types/game';
import type { ClientUser, IUser } from '~/server/types/user';
import type { ChessGame } from '~/entities/game/model/game.model';

export class SSEManager {
  private userManager: UserSSEManager;
  private invitationManager: InvitationSSEManager;
  private gameManager: GameSSEManager;

  constructor() {
    this.userManager = new UserSSEManager();
    this.invitationManager = new InvitationSSEManager();
    this.gameManager = new GameSSEManager();
  }

  // User-related methods
  addUserConnection(userId: string, event: H3Event) {
    this.userManager.addUserConnection(userId, event);
    this.invitationManager.addInvitationConnection(userId, event);
  }

  removeUserConnection(userId: string) {
    this.userManager.removeUserConnection(userId);
    this.invitationManager.removeInvitationConnection(userId);
  }

  isUserConnected(userId: string): boolean {
    return this.userManager.isUserConnected(userId);
  }

  async sendUserStatusUpdate(userId: string, status: UserStatus) {
    await this.userManager.sendUserStatusUpdate(userId, status);
  }

  async broadcastUserListUpdate(users: ClientUser[]) {
    await this.userManager.broadcastUserListUpdate(users);
  }

  async sendGameStartNotification(gameId: string, playerIds: string[]) {
    await this.invitationManager.sendGameStartNotification(gameId, playerIds);
  }

  // Game-related methods
  addGameConnection(gameId: string, userId: string, event: H3Event) {
    this.gameManager.addGameConnection(gameId, userId, event);
  }

  removeGameConnection(gameId: string, userId: string) {
    this.gameManager.removeGameConnection(gameId, userId);
  }

  async sendGameInvitation(fromUserId: string, toUserId: string, fromUsername: string) {
    await this.invitationManager.sendGameInvitation(fromUserId, toUserId, fromUsername);
  }

  addInvitationConnection(userId: string, event: H3Event) {
    this.invitationManager.addInvitationConnection(userId, event);
  }

  removeInvitationConnection(userId: string) {
    this.invitationManager.removeInvitationConnection(userId);
  }

  async broadcastGameUpdate(gameId: string, gameState: ChessGame) {
    await this.gameManager.broadcastGameUpdate(gameId, gameState);
  }

  async sendGameEndNotification(gameId: string, result: GameResult) {
    await this.gameManager.sendGameEndNotification(gameId, result);
  }
}

export const sseManager = new SSEManager();
