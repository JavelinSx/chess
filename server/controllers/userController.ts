import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { config } from '../config/config';

// Функция для создания JWT токена
const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: '30d' });
};

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // Проверяем, существует ли уже пользователь с таким email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Хешируем пароль
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Создаем нового пользователя
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    // Сохраняем пользователя в базе данных
    const savedUser = await newUser.save();

    // Создаем JWT токен
    const token = generateToken(savedUser._id.toString());

    // Устанавливаем httpOnly куку
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Используйте HTTPS в продакшне
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
      sameSite: 'lax',
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: savedUser._id.toString(),
        username: savedUser.username,
        email: savedUser.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Находим пользователя по email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Проверяем пароль
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Создаем JWT токен
    const token = generateToken(user._id.toString());

    // Устанавливаем httpOnly куку
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Используйте HTTPS в продакшне
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
      sameSite: 'lax',
    });

    res.json({
      message: 'Login successful',
      token: token,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};

export const checkAuth = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;

    if (!user) {
      return res.status(401).json({ isAuthenticated: false });
    }

    res.json({
      isAuthenticated: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        // Другие необходимые поля
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error checking authentication', error });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    // req.user установлен в authMiddleware
    const user = req.user as IUser;
    res.json({
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      rating: user.rating,
      gamesPlayed: user.gamesPlayed,
      gamesWon: user.gamesWon,
      gamesLost: user.gamesLost,
      gamesDraw: user.gamesDraw,
      winRate: user.winRate,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;
    const { username, email } = req.body;

    // Проверяем, не занят ли новый email другим пользователем
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Обновляем поля пользователя
    user.username = username || user.username;
    user.email = email || user.email;

    // Если нужно обновить пароль
    // if (password) {
    //   const salt = await bcrypt.genSalt(10);
    //   user.password = await bcrypt.hash(password, salt);
    // }

    // Сохраняем обновленного пользователя
    const updatedUser = await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id.toString(),
        username: updatedUser.username,
        email: updatedUser.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error });
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;

    // Вычисляем дополнительные статистические данные
    const totalGames = user.gamesPlayed;
    const winRate = totalGames > 0 ? (user.gamesWon / totalGames) * 100 : 0;

    res.json({
      username: user.username,
      rating: user.rating,
      gamesPlayed: user.gamesPlayed,
      gamesWon: user.gamesWon,
      gamesLost: user.gamesLost,
      gamesDraw: user.gamesDraw,
      winRate: winRate.toFixed(2) + '%',
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats', error });
  }
};
// Реализации других функций...
