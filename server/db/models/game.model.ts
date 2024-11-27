import mongoose from 'mongoose';
import type { ChessGame } from '~/server/types/game';

const gameStatsSchema = new mongoose.Schema(
  {
    gamesPlayed: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    gamesLost: { type: Number, default: 0 },
    gamesDraw: { type: Number, default: 0 },
    capturedPawns: { type: Number, default: 0 },
    checksGiven: { type: Number, default: 0 },
    castlingsMade: { type: Number, default: 0 },
    promotions: { type: Number, default: 0 },
    averageMovesPerGame: { type: Number, default: 0 },
    longestGame: { type: Number, default: 0 },
    shortestWin: { type: Number, default: 0 },
    comebacks: { type: Number, default: 0 },
    queenSacrifices: { type: Number, default: 0 },
    enPassantCaptures: { type: Number, default: 0 },
    stalemateCaused: { type: Number, default: 0 },
    averageRatingChange: { type: Number, default: 0 },
    winStreakBest: { type: Number, default: 0 },
    currentWinStreak: { type: Number, default: 0 },
    resignations: { type: Number, default: 0 },
    gamesByDuration: {
      15: { type: Number, default: 0 },
      30: { type: Number, default: 0 },
      45: { type: Number, default: 0 },
      90: { type: Number, default: 0 },
    },
  },
  { _id: false }
);

const playerSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    get: (id: mongoose.Types.ObjectId) => id.toString(),
  },
  username: { type: String, required: true },
  avatar: { type: String },
  rating: { type: Number, required: true },
  gameStats: gameStatsSchema,
  ratingChange: { type: Number },
});

const gameSchema = new mongoose.Schema<ChessGame>(
  {
    board: { type: mongoose.Schema.Types.Mixed, required: true },
    currentTurn: { type: String, enum: ['white', 'black'], required: true },
    players: {
      white: { type: playerSchema, required: true },
      black: { type: playerSchema, required: true },
    },
    status: { type: String, enum: ['waiting', 'active', 'completed'], required: true },
    result: {
      winner: { type: String, ref: 'User', default: null },
      loser: { type: String, ref: 'User', default: null },
      reason: { type: String, enum: ['checkmate', 'stalemate', 'draw', 'forfeit', 'timeout'] },
    },

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
