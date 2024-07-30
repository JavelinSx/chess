// shared/api/game.ts

import { apiRequest } from './api';
import type { ApiResponse } from '~/server/types/auth';
import type { ChessGame } from '~/entities/game/model/game.model';

export const gameApi = {
  async acceptInvitation(inviterId: string): Promise<ApiResponse<{ gameId: string }>> {
    return apiRequest<{ gameId: string }>('/game/accept-invite', 'POST', { inviterId });
  },

  async getGame(gameId: string): Promise<ApiResponse<ChessGame>> {
    return apiRequest<ChessGame>(`/game/${gameId}`, 'GET');
  },

  async makeMove(gameId: string, from: [number, number], to: [number, number]): Promise<ApiResponse<ChessGame>> {
    return apiRequest<ChessGame>('/game/move', 'POST', { gameId, from, to });
  },
};
