import { ref, computed } from 'vue';
import ChessBoard from '~/features/game/ui/ChessBoard.vue';
import type { Position, PieceType, ChessGame } from '~/server/types/game';
import { getValidMoves } from '~/shared/game-logic';
import { useGameStore, type GameStore } from '~/store/game';
import { useUserStore, type UserStore } from '~/store/user';

export function useChessBoard() {
  const gameStore = useGameStore();
  const userStore = useUserStore();
  const selectedCell = ref<Position | null>(null);
  const validMoves = ref<Position[]>([]);
  const { currentGame } = storeToRefs(gameStore);

  const isUserPlayingWhite = computed(() => currentGame.value?.players.white!._id === userStore.user?._id);

  const isCurrentPlayerTurn = computed(() => {
    const currentPlayerId =
      currentGame.value?.currentTurn === 'white'
        ? currentGame.value?.players.white!._id
        : currentGame.value?.players.black!._id;
    return currentPlayerId === userStore.user?._id;
  });

  function getAdjustedPosition(row: number, col: number): Position {
    return isUserPlayingWhite.value ? [8 - row, col - 1] : [row - 1, col - 1];
  }

  function getPieceAt(row: number, col: number) {
    if (!currentGame.value) return null;
    const [adjustedRow, adjustedCol] = getAdjustedPosition(row, col);
    return currentGame.value.board[adjustedRow]?.[adjustedCol] ?? null;
  }

  function isSelected(row: number, col: number) {
    return selectedCell.value && selectedCell.value[0] === row && selectedCell.value[1] === col;
  }

  function isValidMove(row: number, col: number) {
    return validMoves.value.some((move) => move[0] === row && move[1] === col);
  }

  async function handleCellClick(position: Position) {
    if (!isCurrentPlayerTurn.value || !currentGame.value) return;

    const [row, col] = position;
    if (!selectedCell.value) {
      const clickedPiece = currentGame.value.board[row][col];
      if (clickedPiece?.color === currentGame.value.currentTurn) {
        selectedCell.value = [row, col];
        validMoves.value = getValidMoves(currentGame.value, selectedCell.value);
      }
    } else {
      const from = selectedCell.value;
      const to: Position = [row, col];
      if (isValidMove(row, col) && (from[0] !== to[0] || from[1] !== to[1])) {
        const piece = currentGame.value.board[from[0]][from[1]];
        if (piece?.type === 'pawn' && (to[0] === 0 || to[0] === 7)) {
          gameStore.pendingPromotion = { from, to };
          gameStore.promote = true;
        } else {
          await gameStore.makeMove(from, to);
        }
      }
      selectedCell.value = null;
      validMoves.value = [];
    }
  }

  function handlePromotion(promoteTo: PieceType) {
    if (isCurrentPlayerTurn.value && gameStore.pendingPromotion) {
      gameStore.promotePawn(promoteTo);
    }
  }

  function getCellClasses(row: number, col: number) {
    const [adjustedRow, adjustedCol] = getAdjustedPosition(row, col);
    const isLightSquare = isUserPlayingWhite.value ? (row + col) % 2 === 0 : (row + col) % 2 !== 0;

    const piece = getPieceAt(row, col);
    const isKingCell = piece?.type === 'king' && piece.color === currentGame.value?.currentTurn;
    const isCheckingPieceCell = currentGame.value?.checkingPieces.some(
      ([checkRow, checkCol]) => checkRow === adjustedRow && checkCol === adjustedCol
    );

    return {
      'bg-beige': isLightSquare,
      'bg-brown': !isLightSquare,
      'highlight-selected': isSelected(adjustedRow, adjustedCol),
      'highlight-valid-move': isValidMove(adjustedRow, adjustedCol),
      'highlight-check': currentGame.value?.isCheck && isKingCell,
      'highlight-checking-piece': isCheckingPieceCell,
    };
  }

  return {
    selectedCell,
    validMoves,
    currentGame,
    isUserPlayingWhite,
    isCurrentPlayerTurn,
    getAdjustedPosition,
    getPieceAt,
    isSelected,
    isValidMove,
    handleCellClick,
    handlePromotion,
    getCellClasses,
  };
}
