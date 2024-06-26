import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  id: string;
  username: string;
  email: string;
  password: string;
  rating: number;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesDraw: number;
  lastLogin: Date;
  isOnline: boolean;
  winRate: number;
}

const UserSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    rating: {
      type: Number,
      default: 1200, // Начальный рейтинг для нового игрока
    },
    gamesPlayed: {
      type: Number,
      default: 0,
    },
    gamesWon: {
      type: Number,
      default: 0,
    },
    gamesLost: {
      type: Number,
      default: 0,
    },
    gamesDraw: {
      type: Number,
      default: 0,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    winRate: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Виртуальное свойство для вычисления процента побед
UserSchema.virtual('winRate').get(function (this: IUser) {
  if (this.gamesPlayed === 0) return 0;
  return (this.gamesWon / this.gamesPlayed) * 100;
});

// Метод для обновления статистики после игры
UserSchema.methods.updateStats = function (result: 'win' | 'loss' | 'draw') {
  this.gamesPlayed += 1;
  if (result === 'win') this.gamesWon += 1;
  else if (result === 'loss') this.gamesLost += 1;
  else if (result === 'draw') this.gamesDraw += 1;
};

// Индексы для оптимизации запросов
UserSchema.index({ username: 1, email: 1 });
UserSchema.index({ rating: -1 }); // Для сортировки по рейтингу

export default mongoose.model<IUser>('User', UserSchema);
