import { TicTacToeMatrix } from "../../../../domain/tic-tac-toe/TicTacToeMatrix.js"
import { TicTacToeMove } from "../../../../domain/tic-tac-toe/TicTacToeMove.js"
import { TicTacToeSymbol } from "../../../../domain/tic-tac-toe/TicTacToeSymbol.js"

export interface TicTacToeStrategy {
    nextMove(matrix: TicTacToeMatrix, symbol: TicTacToeSymbol): TicTacToeMove
}
