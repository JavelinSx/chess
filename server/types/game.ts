export interface GameResult {
  winner: string | null;
  loser: string | null;
  reason: 'checkmate' | 'stalemate' | 'draw' | 'forfeit';
}
