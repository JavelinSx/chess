import mongoose, { Schema, Document } from 'mongoose';

export interface IGame extends Document {
  whitePlayer: string;
  blackPlayer: string;
  moves: string[];
  status: 'ongoing' | 'completed';
  winner?: string;
}

const GameSchema: Schema = new Schema(
  {
    whitePlayer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    blackPlayer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    moves: [{ type: String }],
    status: { type: String, enum: ['ongoing', 'completed'], default: 'ongoing' },
    winner: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model<IGame>('Game', GameSchema);
