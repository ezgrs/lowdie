import { TicTacToeMatrix } from "../TicTacToeMatrix.js"
import { TicTacToeMove } from "../TicTacToeMove.js"
import { TicTacToeSymbol } from "../TicTacToeSymbol.js"
import { TicTacToeStrategy } from "./TicTacToeStrategy.js"

export class EasyTicTacToeStrategy implements TicTacToeStrategy {
    nextMove(
        _matrix: TicTacToeMatrix,
        _symbol: TicTacToeSymbol,
    ): TicTacToeMove {
        return { type: "random" }
    }
}
