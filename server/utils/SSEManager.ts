// server/utils/SSEManager.ts
import { H3Event } from 'h3';
import { UserSSEManager } from './UserSSEManager';
import { updateUserStatus } from '../services/user.service';
import { InvitationSSEManager } from './InvitationSSEManager';
import { GameSSEManager } from './GameSSEManager';
import type { GameResult } from '../types/game';
import type { ClientUser, IUser } from '~/server/types/user';
import type { ChessGame } from '~/entities/game/model/game.model';
import type { UserStatus } from './UserSSEManager';

export class SSEManager {
  private userManager: UserSSEManager;
  private invitationManager: InvitationSSEManager;
  private gameManager: GameSSEManager;
  private activeConnections: Set<string> = new Set();

  constructor() {
    this.userManager = new UserSSEManager();
    this.invitationManager = new InvitationSSEManager();
    this.gameManager = new GameSSEManager();
  }

  addUserConnection(userId: string, event: H3Event) {
    this.userManager.addUserConnection(userId, event);
    this.invitationManager.addInvitationConnection(userId, event);
    this.activeConnections.add(userId);
    updateUserStatus(userId, true, false);
  }

  removeUserConnection(userId: string) {
    this.userManager.removeUserConnection(userId);
    this.invitationManager.removeInvitationConnection(userId);
    this.activeConnections.delete(userId);
    updateUserStatus(userId, false, false);
  }

  isUserConnected(userId: string): boolean {
    return this.activeConnections.has(userId);
  }

  getActiveConnections(): Set<string> {
    return this.activeConnections;
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
  async sendUserUpdate(userId: string, userData: ClientUser) {
    await this.userManager.sendUserUpdate(userId, userData);
  }
}

export const sseManager = new SSEManager();
