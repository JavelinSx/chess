import express from 'express';
import * as userController from '../controllers/userController';
import { authMiddleware } from '../middlewares/auth';

const router = express.Router();

// Регистрация нового пользователя
router.post('/register', userController.register);

// Вход пользователя
router.post('/login', userController.login);

// Получить профиль пользователя
router.get('/profile', authMiddleware, userController.getProfile);

// Обновить профиль пользователя
router.put('/profile', authMiddleware, userController.updateProfile);

// Получить статистику пользователя
router.get('/stats', authMiddleware, userController.getStats);

export default router;
