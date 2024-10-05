import mongoose from 'mongoose';
import type { ChessGame } from '~/server/types/game';

const gameSchema = new mongoose.Schema<ChessGame>(
  {
    board: { type: mongoose.Schema.Types.Mixed, required: true },
    currentTurn: { type: String, enum: ['white', 'black'], required: true },
    players: {
      white: { type: String, ref: 'User' },
      black: { type: String, ref: 'User' },
    },
    status: { type: String, enum: ['waiting', 'active', 'completed'], required: true },
    result: {
      winner: { type: String, ref: 'User', default: null },
      loser: { type: String, ref: 'User', default: null },
      reason: { type: String, enum: ['checkmate', 'stalemate', 'draw', 'forfeit', 'timeout'] },
    },

    inviterId: { type: String, ref: 'User', required: true },
    inviteeId: { type: String, ref: 'User', required: true },
    moveCount: { type: Number, default: 0 },
    halfMoveClock: { type: Number, default: 0 },
    enPassantTarget: { type: [Number], default: null },
    positions: { type: [String], default: [] },
    castlingRights: {
      whiteKingSide: { type: Boolean, default: true },
      whiteQueenSide: { type: Boolean, default: true },
      blackKingSide: { type: Boolean, default: true },
      blackQueenSide: { type: Boolean, default: true },
    },
    isCheck: { type: Boolean, default: false },
    checkingPieces: { type: [[Number]], default: [] },
    isCheckmate: { type: Boolean, default: false },
    isStalemate: { type: Boolean, default: false },
    capturedPieces: {
      white: { type: [String], default: [] },
      black: { type: [String], default: [] },
    },
    pendingPromotion: {
      from: { type: [Number], default: null },
      to: { type: [Number], default: null },
      promoteTo: { type: String, default: null },
    },
    moveHistory: [
      {
        from: { type: [Number], required: true },
        to: { type: [Number], required: true },
        piece: {
          type: { type: String, enum: ['pawn', 'rook', 'knight', 'bishop', 'queen', 'king'], required: true },
          color: { type: String, enum: ['white', 'black'], required: true },
        },
        capturedPiece: {
          type: { type: String, enum: ['pawn', 'rook', 'knight', 'bishop', 'queen', 'king'] },
          color: { type: String, enum: ['white', 'black'] },
        },
        isCheck: { type: Boolean, required: true },
        isCheckmate: { type: Boolean, required: true },
        isCastling: { type: Boolean, required: true },
        isEnPassant: { type: Boolean, required: true },
        isPromotion: { type: Boolean, required: true },
        promotedTo: { type: String, enum: ['queen', 'rook', 'knight', 'bishop'] },
        player: { type: String, required: true },
      },
    ],
    timeControl: {
      type: {
        type: String,
        enum: ['timed', 'untimed'],
        required: true,
      },
      initialTime: {
        type: Number,
        enum: [15, 30, 45, 90],
      },
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model<ChessGame>('Game', gameSchema);
