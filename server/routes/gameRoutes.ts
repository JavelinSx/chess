import express from 'express';
import * as gameController from '../controllers/gameController';
import { authMiddleware } from '../middlewares/auth';

const router = express.Router();

// Получить список всех игр
router.get('/', authMiddleware, gameController.getAllGames);

// Создать новую игру
router.post('/', authMiddleware, gameController.createGame);

// Получить информацию о конкретной игре
router.get('/:id', authMiddleware, gameController.getGame);

// Сделать ход
router.post('/:id/move', authMiddleware, gameController.makeMove);

// Завершить игру
router.post('/:id/end', authMiddleware, gameController.endGame);

export default router;
