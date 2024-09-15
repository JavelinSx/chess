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

export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type PieceColor = 'white' | 'black';
export type Position = [number, number];

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
  reason: 'checkmate' | 'stalemate' | 'draw' | 'forfeit';
}

export interface CastlingRights {
  whiteKingSide: boolean;
  whiteQueenSide: boolean;
  blackKingSide: boolean;
  blackQueenSide: boolean;
}

export interface ChessGame {
  id: string;
  board: ChessBoard;
  currentTurn: PieceColor;
  players: {
    white: string | null;
    black: string | null;
  };
  status: 'waiting' | 'active' | 'completed';
  winner: string | null;
  loser: string | null;
  inviterId: string;
  inviteeId: string;
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
}

export function initializeGame(id: string, inviterId: string, inviteeId: string): ChessGame {
  return {
    id,
    board: initializeBoard(),
    currentTurn: 'white',
    players: {
      white: null,
      black: null,
    },
    status: 'waiting',
    winner: null,
    loser: null,
    inviterId,
    inviteeId,
    moveCount: 0,
    halfMoveClock: 0,
    enPassantTarget: null,
    positions: [],
    castlingRights: {
      whiteKingSide: true,
      whiteQueenSide: true,
      blackKingSide: true,
      blackQueenSide: true,
    },
    isCheck: false,
    checkingPieces: [],
    capturedPieces: {
      white: [],
      black: [],
    },
    isCheckmate: false,
    isStalemate: false,
    pendingPromotion: {
      from: null,
      to: null,
      promoteTo: null,
    },
  };
}
