import { TicTacToeMatrix } from "../../../../domain/tic-tac-toe/TicTacToeMatrix.js"
import { TicTacToeMove } from "../../../../domain/tic-tac-toe/TicTacToeMove.js"
import { TicTacToeSymbol } from "../../../../domain/tic-tac-toe/TicTacToeSymbol.js"
import { TicTacToeStrategy } from "./TicTacToeStrategy.js"

export class EasyTicTacToeStrategy implements TicTacToeStrategy {
    nextMove(
        _matrix: TicTacToeMatrix,
        _symbol: TicTacToeSymbol,
    ): TicTacToeMove {
        return { type: "random" }
    }
}
