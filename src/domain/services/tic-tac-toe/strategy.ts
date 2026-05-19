import { Randomizer } from "@/src/application/ports/Randomizer.js"
import {
    TicTacToeDifficulty,
    TicTacToeMatrix,
    TicTacToeMove,
    TicTacToeSymbol,
} from "@/src/domain/entities/TicTacToe.js"
import { axesOf, oppositeSymbolOf } from "@/src/domain/services/TicTacToe.js"

export function strategyFromDifficulty(
    difficulty: TicTacToeDifficulty,
    randomizer: Randomizer,
) {
    let strategy: TicTacToeStrategy = new EasyTicTacToeStrategy()
    if (difficulty === "easy") return strategy
    strategy = new NormalTicTacToeStrategy(strategy)
    if (difficulty === "normal") return strategy
    return new HardTicTacToeStrategy({
        randomizer: randomizer,
        strategy: strategy,
    })
}

export interface TicTacToeStrategy {
    nextMove(matrix: TicTacToeMatrix, symbol: TicTacToeSymbol): TicTacToeMove
}

export class EasyTicTacToeStrategy implements TicTacToeStrategy {
    nextMove(
        _matrix: TicTacToeMatrix,
        _symbol: TicTacToeSymbol,
    ): TicTacToeMove {
        return { type: "random" }
    }
}

export class NormalTicTacToeStrategy implements TicTacToeStrategy {
    constructor(private strategy: TicTacToeStrategy) {}

    nextMove(matrix: TicTacToeMatrix, symbol: TicTacToeSymbol): TicTacToeMove {
        const opponentSymbol = oppositeSymbolOf(symbol)
        for (const axis of axesOf(matrix)) {
            // Count the occurrence of each symbol
            const info: Map<TicTacToeSymbol | null, number> = new Map()
            axis.locations.forEach((location) => {
                const count = info.get(location.symbol) || 0
                info.set(location.symbol, count + 1)
            })

            // Only check one-to-win situations
            if (info.get(null) !== 1) continue
            const emptyLocationIndex = axis.locations.findIndex(
                (location) => location.symbol === null,
            )
            const coordinates: [number, number] = [
                axis.locations[emptyLocationIndex]!.row,
                axis.locations[emptyLocationIndex]!.col,
            ]
            if (info.get(symbol) === 2) {
                return {
                    type: "exact",
                    coordinates: coordinates,
                }
            }
            if (info.get(opponentSymbol) === 2) {
                return {
                    type: "exact",
                    coordinates: coordinates,
                }
            }
        }

        // If there is no one-to-win situation, forward to an easier strategy
        return this.strategy.nextMove(matrix, symbol)
    }
}

type HardStrategyArgs = {
    strategy: TicTacToeStrategy
    randomizer: Randomizer
}

export class HardTicTacToeStrategy implements TicTacToeStrategy {
    private strategy: TicTacToeStrategy
    private randomizer: Randomizer

    constructor(args: HardStrategyArgs) {
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
