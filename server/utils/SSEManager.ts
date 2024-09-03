// server/utils/SSEManager.ts
import { H3Event } from 'h3';
import { UserSSEManager } from './UserSSEManager';
import { updateUserStatus } from '../services/user.service';
import { InvitationSSEManager } from './InvitationSSEManager';
import { GameSSEManager } from './GameSSEManager';
import { ChatSSEManager } from './ChatSSEManager';

import type { ClientChatMessage, ClientChatRoom } from '../types/chat';
import type { GameResult } from '../types/game';
import type { ClientUser, IUser } from '~/server/types/user';
import type { ChessGame } from '~/entities/game/model/game.model';
import type { UserStatus } from './UserSSEManager';
import type { Friend, FriendRequest, FriendRequestClient } from '../types/friends';

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

  addUserConnection(userId: string, event: H3Event) {
    this.userManager.addUserConnection(userId, event);
    this.invitationManager.addInvitationConnection(userId, event);
    this.chatManager.addChatConnection(userId, event);
    this.activeConnections.add(userId);
    updateUserStatus(userId, true, false);
  }

  removeUserConnection(userId: string) {
    this.userManager.removeUserConnection(userId);
    this.invitationManager.removeInvitationConnection(userId);
    this.chatManager.removeChatConnection(userId);
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

  async sendChatMessage(userId: string, message: ClientChatMessage) {
    console.log(`Sending chat message in SSEManager to user: ${userId}`, message);
    await this.chatManager.sendChatMessage(userId, message);
  }

  async sendChatRoomUpdate(userId: string, room: ClientChatRoom) {
    console.log(`Sending chat room update in SSEManager to user: ${userId}`, room);
    await this.chatManager.sendChatRoomUpdate(userId, room);
  }
}

export const sseManager = new SSEManager();
