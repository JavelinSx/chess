import type { UserStats } from './user';

export function initializeBoard(): ChessBoard {
  const board: ChessBoard = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

  const backRow: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

  for (let i = 0; i < 8; i++) {
    board[1][i] = { type: 'pawn', color: 'white' };
    board[6][i] = { type: 'pawn', color: 'black' };

    board[0][i] = { type: backRow[i], color: 'white' };
    board[7][i] = { type: backRow[i], color: 'black' };
  }

  return board;
}

export type GameDuration = 15 | 30 | 45 | 90;
export type StartColor = 'white' | 'black' | 'random';
export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type PieceColor = 'white' | 'black';
export type Position = [number, number];
export type GameResultReason = 'checkmate' | 'stalemate' | 'draw' | 'forfeit' | 'timeout';

export interface GamePlayer {
  _id: string;
  username: string;
  avatar: string;
  rating: number;
  gameStats: UserStats;
}

export interface UpdateTime {
  whiteTime: number;
  blackTime: number;
  activeColor: PieceColor;
  lastUpdateTime: number;
}

export interface MoveHistoryEntry {
  from: Position;
  to: Position;
  piece: ChessPiece;
  capturedPiece?: ChessPiece;
  isCheck: boolean;
  isCheckmate: boolean;
  isCastling: boolean;
  isEnPassant: boolean;
  isPromotion: boolean;
  promotedTo?: PieceType;
  player: string;
}

export interface MoveValidationParams {
  game: ChessGame;
  from: Position;
  to: Position;
}
export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
}

export type ChessBoard = (ChessPiece | null)[][];

export interface GameResult {
  winner: string | null;
  loser: string | null;
  reason: GameResultReason | null;
  ratingChanges?: {
    [key: string]: number;
  } | null;
}

export interface CastlingRights {
  whiteKingSide: boolean;
  whiteQueenSide: boolean;
  blackKingSide: boolean;
  blackQueenSide: boolean;
}

export interface ChessGame {
  _id: string;
  board: ChessBoard;
  currentTurn: PieceColor;
  players: {
    white: GamePlayer | null;
    black: GamePlayer | null;
  };
  status: 'waiting' | 'active' | 'completed';
  result: GameResult;
  moveCount: number;
  halfMoveClock: number;
  enPassantTarget: [number, number] | null;
  positions: string[];
  castlingRights: CastlingRights;
  isCheck: boolean;
  checkingPieces: Position[];
  capturedPieces: {
    white: PieceType[];
    black: PieceType[];
  };
  isCheckmate: boolean;
  isStalemate: boolean;
  pendingPromotion: {
    from: [Number] | null;
    to: [Number] | null;
    promoteTo: string | null;
  };
  moveHistory: MoveHistoryEntry[];
  timeControl: TimeControl | null;
  startedAt: Date | null;
  whiteTime: number;
  blackTime: number;
  lastTimerUpdate: number;
}

export interface TimeControl {
  type: 'timed' | 'untimed';
  initialTime?: 15 | 30 | 45 | 90;
}

// export function initializeGame(inviterId: string, inviteeId: string): ChessGame {
//   return {
//     _id: '',
//     board: initializeBoard(),
//     currentTurn: 'white',
//     players: {
//       white: null,
//       black: null,
//     },
//     status: 'waiting',
//     result: {
//       winner: null,
//       loser: null,
//       reason: null,
//       ratingChanges: null,
//     },
//     moveCount: 0,
//     halfMoveClock: 0,
//     enPassantTarget: null,
//     positions: [],
//     castlingRights: {
//       whiteKingSide: true,
//       whiteQueenSide: true,
//       blackKingSide: true,
//       blackQueenSide: true,
//     },
//     isCheck: false,
//     checkingPieces: [],
//     capturedPieces: {
//       white: [],
//       black: [],
//     },
//     isCheckmate: false,
//     isStalemate: false,
//     pendingPromotion: {
//       from: null,
//       to: null,
//       promoteTo: null,
//     },
//     moveHistory: [],
//     timeControl: null,
//     startedAt: null,
//   };
// }
