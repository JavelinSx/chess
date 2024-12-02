import type { ChessGame, Position } from '~/server/types/game';
import { makeMove, isCapture, getPieceAt } from './board';
import { isKingInCheck, isCheckmate, isStalemate } from './check';
import { isPawnPromotion, isEnPassant, isCastling, performEnPassant, performCastling } from './special-moves';
import { isPawnDoubleMove, getEnPassantTarget } from '../pieces/pawn';
import { updatePositionsHistory } from './game-history';

// Основная функция выполнения хода в игре. Принимает текущее состояние игры и координаты откуда/куда сделан ход
export function performMove(game: ChessGame, from: Position, to: Position): ChessGame {
  // makeMove создает новую доску с перемещенной фигурой с позиции from на позицию to
  let newBoard = makeMove(game.board, from, to);
  // Определяем цвет следующего игрока
  const oppositeColor = game.currentTurn === 'white' ? 'black' : 'white';

  // Обработка специальных ходов:

  // isPawnPromotion проверяет, достигла ли пешка последней линии для превращения
  if (isPawnPromotion(newBoard, from, to)) {
    // Если сработало сразу возвращаем результат для дальнейшей логики прохода пешки
    return { ...game, board: newBoard };
  }
  // isEnPassant проверяет, является ли ход взятием на проходе
  else if (isEnPassant(game, from, to)) {
    // performEnPassant выполняет взятие на проходе, удаляя пешку противника
    newBoard = performEnPassant(game.board, from, to);
  }
  // isCastling проверяет, является ли ход рокировкой
  else if (isCastling(game, from, to)) {
    // performCastling выполняет рокировку, перемещая короля и ладью
    newBoard = performCastling(game.board, from, to);
  }

  // getPieceAt получает фигуру в позиции to для отслеживания взятий
  const capturedPiece = getPieceAt(game.board, to);
  const newCapturedPieces = { ...game.capturedPieces };
  // Если была взята фигура, добавляем её в список взятых фигур
  if (capturedPiece) {
    newCapturedPieces[game.currentTurn] = [...newCapturedPieces[game.currentTurn], capturedPiece.type];
  }

  // Создаем новое состояние игры
  const newGame: ChessGame = {
    ...game,
    board: newBoard,
    currentTurn: oppositeColor,
    moveCount: game.moveCount + 1,
    // Обновляем счетчик полуходов (для правила 50 ходов) - сбрасывается при взятии или ходе пешкой
    halfMoveClock:
      isCapture(game.board, to) || game.board[from[0]][from[1]]?.type === 'pawn' ? 0 : game.halfMoveClock + 1,
    // isPawnDoubleMove проверяет, сделала ли пешка ход на два поля
    // getEnPassantTarget определяет поле для возможного взятия на проходе
    enPassantTarget: isPawnDoubleMove(from, to) ? getEnPassantTarget(from, to) : null,
    // updatePositionsHistory обновляет историю позиций для определения троекратного повторения
    positions: updatePositionsHistory(game.positions, newBoard),
    capturedPieces: newCapturedPieces,
  };

  // Проверка шаха, мата и пата:
  // isKingInCheck проверяет, находится ли король под шахом
  const { inCheck, checkingPieces } = isKingInCheck(newGame);
  newGame.isCheck = inCheck;
  newGame.checkingPieces = checkingPieces;
  // isCheckmate проверяет наличие мата
  newGame.isCheckmate = isCheckmate(newGame);
  // isStalemate проверяет наличие пата
  newGame.isStalemate = !newGame.isCheckmate && isStalemate(newGame);

  return newGame;
}
