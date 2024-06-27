import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import mongoose from 'mongoose';
import { config } from './config/config';
import gameRoutes from './routes/gameRoutes';
import userRoutes from './routes/userRoutes';

const app = express();

app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/games', gameRoutes);
app.use('/api/users', userRoutes);

// Connect to MongoDB
mongoose
  .connect(config.mongoUri)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

export default app;
