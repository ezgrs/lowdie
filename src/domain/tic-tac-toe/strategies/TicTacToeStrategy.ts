import { TicTacToeMatrix } from "../TicTacToeMatrix.js"
import { TicTacToeMove } from "../TicTacToeMove.js"
import { TicTacToeSymbol } from "../TicTacToeSymbol.js"

export interface TicTacToeStrategy {
    nextMove(matrix: TicTacToeMatrix, symbol: TicTacToeSymbol): TicTacToeMove
}
