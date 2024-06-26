// server/middlewares/auth.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import User from '../models/User';
import type { IUser } from '../models/User';

interface DecodedToken {
  userId: string;
}

// Расширяем интерфейс Request, чтобы включить пользователя
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Получаем токен из заголовка Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1]; // Формат: "Bearer TOKEN"
    if (!token) {
      return res.status(401).json({ message: 'Token missing' });
    }

    // Верифицируем токен
    const decoded = jwt.verify(token, config.jwtSecret) as DecodedToken;

    // Находим пользователя по ID из токена
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Добавляем пользователя к объекту запроса
    req.user = user;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};
