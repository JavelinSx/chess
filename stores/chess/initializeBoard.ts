import { IPiece, ISquare, IPosition } from "@/entities/piece/model/Piece";

// Функция для создания пустой доски с координатами для каждой ячейки
function createEmptyBoard(): ISquare[][] {
    const board: ISquare[][] = [];
    for (let y = 0; y < 8; y++) {
        const row: ISquare[] = [];
        for (let x = 0; x < 8; x++) {
            row.push({
                piece: null,
                position: { x, y }
            });
        }
        board.push(row);
    }
    return board;
}

// Функция для установки фигур на доску
function setPieces(board: ISquare[][], pieces: IPiece[]): void {
    pieces.forEach(piece => {
        board[piece.position.y][piece.position.x].piece = piece;
    });
}

export function initializeBoard(): ISquare[][] {
    const board = createEmptyBoard();

    const pieces: IPiece[] = [
        // White pieces
        { type: 'rook', color: 'white', position: { x: 0, y: 0 } },
        { type: 'knight', color: 'white', position: { x: 1, y: 0 } },
        { type: 'bishop', color: 'white', position: { x: 2, y: 0 } },
        { type: 'queen', color: 'white', position: { x: 3, y: 0 } },
        { type: 'king', color: 'white', position: { x: 4, y: 0 } },
        { type: 'bishop', color: 'white', position: { x: 5, y: 0 } },
        { type: 'knight', color: 'white', position: { x: 6, y: 0 } },
        { type: 'rook', color: 'white', position: { x: 7, y: 0 } },
        { type: 'pawn', color: 'white', position: { x: 0, y: 1 } },
        { type: 'pawn', color: 'white', position: { x: 1, y: 1 } },
        { type: 'pawn', color: 'white', position: { x: 2, y: 1 } },
        { type: 'pawn', color: 'white', position: { x: 3, y: 1 } },
        { type: 'pawn', color: 'white', position: { x: 4, y: 1 } },
        { type: 'pawn', color: 'white', position: { x: 5, y: 1 } },
        { type: 'pawn', color: 'white', position: { x: 6, y: 1 } },
        { type: 'pawn', color: 'white', position: { x: 7, y: 1 } },

        // Black pieces
        { type: 'rook', color: 'black', position: { x: 0, y: 7 } },
        { type: 'knight', color: 'black', position: { x: 1, y: 7 } },
        { type: 'bishop', color: 'black', position: { x: 2, y: 7 } },
        { type: 'queen', color: 'black', position: { x: 3, y: 7 } },
        { type: 'king', color: 'black', position: { x: 4, y: 7 } },
        { type: 'bishop', color: 'black', position: { x: 5, y: 7 } },
        { type: 'knight', color: 'black', position: { x: 6, y: 7 } },
        { type: 'rook', color: 'black', position: { x: 7, y: 7 } },
        { type: 'pawn', color: 'black', position: { x: 0, y: 6 } },
        { type: 'pawn', color: 'black', position: { x: 1, y: 6 } },
        { type: 'pawn', color: 'black', position: { x: 2, y: 6 } },
        { type: 'pawn', color: 'black', position: { x: 3, y: 6 } },
        { type: 'pawn', color: 'black', position: { x: 4, y: 6 } },
        { type: 'pawn', color: 'black', position: { x: 5, y: 6 } },
        { type: 'pawn', color: 'black', position: { x: 6, y: 6 } },
        { type: 'pawn', color: 'black', position: { x: 7, y: 6 } }
    ];

    setPieces(board, pieces);
    return board;
}
