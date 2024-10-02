import { H3Event } from 'h3';
import { UserSSEManager } from './UserSSEManager';
import { UserService } from '../services/user.service';
import { InvitationSSEManager } from './InvitationSSEManager';
import { GameSSEManager } from './GameSSEManager';
import { ChatSSEManager } from './ChatSSEManager';
import type { GameDuration, GameResult } from '../types/game';
import type { ClientUser } from '~/server/types/user';
import type { ChessGame } from '../types/game';
import type { UserStatus } from './UserSSEManager';
import type { Friend, FriendRequest, FriendRequestClient } from '../types/friends';
import type { ChatMessage, IChatRoom } from '../types/chat';

export class SSEManager {
  private userManager: UserSSEManager;
  private invitationManager: InvitationSSEManager;
  private gameManager: GameSSEManager;
  private chatManager: ChatSSEManager;
  private activeConnections: Set<string> = new Set();

  constructor() {
    this.userManager = new UserSSEManager();
    this.invitationManager = new InvitationSSEManager();
    this.gameManager = new GameSSEManager();
    this.chatManager = new ChatSSEManager();
  }

  // User-related methods
  addUserConnection(userId: string, event: H3Event) {
    if (!this.activeConnections.has(userId)) {
      this.userManager.addUserConnection(userId, event);
      this.invitationManager.addInvitationConnection(userId, event);
      this.activeConnections.add(userId);
      UserService.updateUserStatus(userId, true, false);
    }
  }

  removeUserConnection(userId: string) {
    this.userManager.removeUserConnection(userId);
    this.invitationManager.removeInvitationConnection(userId);
    this.activeConnections.delete(userId);
    UserService.updateUserStatus(userId, false, false);
  }

  isUserConnected(userId: string): boolean {
    return this.activeConnections.has(userId);
  }

  getActiveConnections(): Set<string> {
    return this.activeConnections;
  }

  async broadcastUserStatusUpdate(userId: string, status: UserStatus) {
    await this.userManager.broadcastUserStatusUpdate(userId, status);
  }

  async broadcastUserListUpdate(users: ClientUser[]) {
    await this.userManager.broadcastUserListUpdate(users);
  }

  async sendUserUpdate(userData: ClientUser) {
    await this.userManager.sendUserUpdate(userData);
  }

  async sendFriendRequestNotification(userId: string, request: FriendRequest) {
    await this.userManager.sendFriendRequestNotification(userId, request);
  }

  async sendFriendRequestUpdateNotification(userId: string, updatedRequest: FriendRequestClient) {
    await this.userManager.sendFriendRequestUpdateNotification(userId, updatedRequest);
  }

  async sendFriendRequestsUpdateNotification(userId: string, updatedRequest: FriendRequest[]) {
    await this.userManager.sendFriendRequestsUpdateNotification(userId, updatedRequest);
  }

  async sendFriendListUpdateNotification(userId: string, friendList: Friend[]) {
    await this.userManager.sendFriendListUpdateNotification(userId, friendList);
  }

  // Chat-related methods
  addChatConnection(userId: string, event: H3Event) {
    this.chatManager.addChatConnection(userId, event);
  }

  removeChatConnection(userId: string) {
    this.chatManager.removeChatConnection(userId);
  }

  async sendChatMessage(roomId: string, message: ChatMessage) {
    await this.chatManager.sendChatMessage(roomId, message);
  }

  async sendChatRoomCreated(userId: string, room: IChatRoom) {
    await this.chatManager.sendChatRoomCreated(userId, room);
  }

  async sendChatRoomUpdateNotification(userId: string, roomId: string) {
    await this.chatManager.sendChatRoomUpdateNotification(userId, roomId);
  }

  // Game-related methods
  addGameConnection(gameId: string, userId: string, event: H3Event) {
    this.gameManager.addGameConnection(gameId, userId, event);
  }

  removeGameConnection(gameId: string, userId: string) {
    this.gameManager.removeGameConnection(gameId, userId);
  }

  async broadcastGameUpdate(gameId: string, gameState: ChessGame) {
    await this.gameManager.broadcastGameUpdate(gameId, gameState);
  }

  async sendGameEndNotification(gameId: string, result: GameResult) {
    await this.gameManager.sendGameEndNotification(gameId, result);
  }

  // Invitation-related methods
  async sendGameInvitation(fromUserId: string, toUserId: string, fromUsername: string, gameDuration: number) {
    await this.invitationManager.sendGameInvitation(fromUserId, toUserId, fromUsername, gameDuration as GameDuration);
  }

  addInvitationConnection(userId: string, event: H3Event) {
    this.invitationManager.addInvitationConnection(userId, event);
  }

  removeInvitationConnection(userId: string) {
    this.invitationManager.removeInvitationConnection(userId);
  }

  async sendGameStartNotification(gameId: string, playerIds: string[]) {
    await this.invitationManager.sendGameStartNotification(gameId, playerIds);
  }
}

export const sseManager = new SSEManager();
