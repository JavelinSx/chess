import { apiRequest } from './api';
import type { ApiResponse } from '~/server/types/auth';
import type { ChessGame } from '~/entities/game/model/game.model';
import type { Position } from '~/features/game-logic/model/pieces/types';

export const gameApi = {
  async acceptInvitation(inviterId: string): Promise<ApiResponse<{ gameId: string }>> {
    return apiRequest<{ gameId: string }>('/game/accept-invite', 'POST', { inviterId });
  },

  async getGame(gameId: string): Promise<ApiResponse<ChessGame>> {
    return apiRequest<ChessGame>(`/game/${gameId}`, 'GET');
  },

  async makeMove(gameId: string, from: Position, to: Position): Promise<ApiResponse<ChessGame>> {
    return apiRequest<ChessGame>('/game/move', 'POST', { gameId, from, to });
  },

  async forcedEndGame(gameId: string): Promise<ApiResponse<{ message: string }>> {
    return apiRequest<{ message: string }>('/game/forced-end-game', 'POST', { gameId });
  },
};
