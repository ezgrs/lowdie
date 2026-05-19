import { Randomizer } from "@/application/ports/Randomizer.js"
import {
    TicTacToeMatrix,
    TicTacToeMove,
    TicTacToeSymbol,
} from "@/domain/entities/TicTacToe.js"
import { randomEmptyPositionOf } from "@/domain/services/TicTacToe.js"

type Args = {
    randomizer: Randomizer
    matrix: TicTacToeMatrix
}

export class TicTacToeBoard {
    private randomizer: Randomizer
    readonly matrix: TicTacToeMatrix

    constructor(args: Args) {
        this.randomizer = args.randomizer
        this.matrix = args.matrix
    }

    apply(
        symbol: TicTacToeSymbol,
        move: TicTacToeMove,
    ): TicTacToeBoard | undefined {
        switch (move.type) {
            case "random":
                const coordinates = randomEmptyPositionOf(
                    this.randomizer,
                    this.matrix,
                )
                if (coordinates == null) return undefined
                return this.add(symbol, coordinates[0], coordinates[1])
            case "exact":
                return this.add(
                    symbol,
                    move.coordinates[0],
                    move.coordinates[1],
                )
        }
    }

    private add(
        piece: TicTacToeSymbol,
        r: number,
        c: number,
    ): TicTacToeBoard | undefined {
        if (r < 0 || r > 2) return undefined
        if (c < 0 || c > 2) return undefined

        if (this.matrix[r]![c] != null) {
            return undefined
        }

        const row = [...this.matrix[r]!]
        row[c] = piece
        return new TicTacToeBoard({
            randomizer: this.randomizer,
            matrix: this.matrix.map((row_, r_) => (r_ == r ? row : [...row_])),
        })
    }
}
