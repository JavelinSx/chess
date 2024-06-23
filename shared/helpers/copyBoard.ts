import { ISquare } from '@/types';

// Utility function to create a deep copy of the board
export const copyBoard = (board: ISquare[][]): ISquare[][] => {
  return board.map((row) =>
    row.map((square) => ({
      ...square,
      state: {
        ...square.state,
        position: { ...square.state.position },
      },
    }))
  );
};
