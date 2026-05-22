import { Randomizer } from "@/application/ports/Randomizer.js"
import { axesOf } from "../../../../domain/tic-tac-toe/rules.js"
import { TicTacToeMatrix } from "../../../../domain/tic-tac-toe/TicTacToeMatrix.js"
import { TicTacToeMove } from "../../../../domain/tic-tac-toe/TicTacToeMove.js"
import { TicTacToeSymbol } from "../../../../domain/tic-tac-toe/TicTacToeSymbol.js"
import { TicTacToeStrategy } from "./TicTacToeStrategy.js"

type Args = {
    strategy: TicTacToeStrategy
    randomizer: Randomizer
}

export class HardTicTacToeStrategy implements TicTacToeStrategy {
    private strategy: TicTacToeStrategy
    private randomizer: Randomizer

    constructor(args: Args) {
        this.strategy = args.strategy
        this.randomizer = args.randomizer
    }

    nextMove(matrix: TicTacToeMatrix, symbol: TicTacToeSymbol): TicTacToeMove {
        const move = this.strategy.nextMove(matrix, symbol)
        if (move.type !== "random") {
            return move
        }

        let count = 0
        for (const axis of axesOf(matrix)) {
            for (const location of axis.locations) {
                if (location.symbol != null) {
                    count += 1
                }
            }
        }
        switch (count) {
            // If it's X, insert at a corner
            case 0:
            case 2:
            case 4: {
                const coordinates: [number, number][] = this.randomizer.shuffle<
                    [number, number]
                >([
                    [0, 0],
                    [0, 2],
                    [2, 0],
                    [2, 2],
                ])
                for (const [x, y] of coordinates) {
                    if (matrix[x]![y] !== null) {
                        continue
                    }
                    return { type: "exact", coordinates: [x, y] }
                }
            }
        }
        return move
    }
}
