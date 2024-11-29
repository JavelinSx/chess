import { apiRequest } from './api';
import type { ApiResponse } from '~/server/types/api';
import type {
  ChessGame,
  Position,
  PieceType,
  GameResult,
  GameDuration,
  StartColor,
  UpdateTime,
  PieceColor,
} from '~/server/types/game';
import type { UserStats } from '~/server/types/user';

export const gameApi = {
  async acceptInvitation(
    inviterId: string,
    timeControl: { type: 'timed' | 'untimed'; initialTime?: GameDuration },
    startColor: StartColor
  ): Promise<ApiResponse<{ gameId: string }>> {
    return apiRequest<{ gameId: string }>('/game/accept-invite', 'POST', { inviterId, timeControl, startColor });
  },

  async rejectInvitation(): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest<{ success: boolean }>('/game/reject', 'POST');
  },

  async sendInvitation(
    toInviteId: string,
    gameDuration: GameDuration,
    startColor: StartColor
  ): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest<{ success: boolean }>('/game/invite', 'POST', { toInviteId, gameDuration, startColor });
  },

  async getGame(gameId: string): Promise<ApiResponse<ChessGame>> {
    return apiRequest<ChessGame>(`/game/${gameId}`, 'GET');
  },

  async makeMove(
    gameId: string,
    from: Position,
    to: Position,
    whiteTime: number,
    blackTime: number,
    promoteTo?: PieceType
  ): Promise<ApiResponse<ChessGame>> {
    return apiRequest<ChessGame>('/game/move', 'POST', { gameId, from, to, whiteTime, blackTime, promoteTo });
  },

  async endGame(gameId: string, result: GameResult): Promise<ApiResponse<GameResult>> {
    return apiRequest<GameResult>('/game/end', 'POST', { gameId, result });
  },

  async updateTimer(gameId: string, whiteTime: number, blackTime: number): Promise<ApiResponse<void>> {
    return apiRequest(`/game/${gameId}/timer`, 'POST', { whiteTime, blackTime });
  },
};
