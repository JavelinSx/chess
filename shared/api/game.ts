import { apiRequest } from './api';
import type { ApiResponse } from '~/server/types/auth';
import type { ChessGame } from '~/entities/game/model/game.model';
import type { Position } from '~/features/game-logic/model/pieces/types';
import type { PieceType } from '~/entities/game/model/board.model';

export const gameApi = {
  async acceptInvitation(inviterId: string): Promise<ApiResponse<{ gameId: string }>> {
    return apiRequest<{ gameId: string }>('/game/accept-invite', 'POST', { inviterId });
  },
  async sendInvitation(toInviteId: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest<{ success: boolean }>('/game/invite', 'POST', { toInviteId });
  },
  async getGame(gameId: string): Promise<ApiResponse<ChessGame>> {
    return apiRequest<ChessGame>(`/game/${gameId}`, 'GET');
  },

  makeMove(gameId: string, from: Position, to: Position, promoteTo?: PieceType): Promise<ApiResponse<ChessGame>> {
    return apiRequest<ChessGame>('/game/move', 'POST', { gameId, from, to, promoteTo });
  },

  async forcedEndGame(gameId: string): Promise<ApiResponse<{ message: string }>> {
    return apiRequest<{ message: string }>('/game/forced-end-game', 'POST', { gameId });
  },
};
