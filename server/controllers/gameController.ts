import { Request, Response } from 'express';
import Game from '../models/Game';

export const getAllGames = async (req: Request, res: Response) => {
  // Реализация получения всех игр
};

export const createGame = async (req: Request, res: Response) => {
  // Реализация создания новой игры
};

export const getGame = async (req: Request, res: Response) => {
  // Реализация получения информации о конкретной игре
};

export const makeMove = async (req: Request, res: Response) => {
  // Реализация выполнения хода
};

export const endGame = async (req: Request, res: Response) => {
  // Реализация завершения игры
};
