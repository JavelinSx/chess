import mongoose from 'mongoose';
import type { ChessGame } from '~/entities/game/model/game.model';

const gameSchema = new mongoose.Schema<ChessGame>(
  {
    id: { type: String, required: true, unique: true },
    board: { type: mongoose.Schema.Types.Mixed, required: true },
    currentTurn: { type: String, enum: ['white', 'black'], required: true },
    players: {
      white: { type: String, ref: 'User' },
      black: { type: String, ref: 'User' },
    },
    status: { type: String, enum: ['waiting', 'active', 'completed'], required: true },
    winner: { type: String, ref: 'User', default: null },
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
  },
  { timestamps: true }
);

export default mongoose.model<ChessGame>('Game', gameSchema);
