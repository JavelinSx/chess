export interface GameResult {
  winner: string | null;
  reason: 'checkmate' | 'stalemate' | 'draw' | 'forfeit';
}
