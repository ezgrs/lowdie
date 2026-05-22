import {
    oppositeSymbolOf,
    axesOf,
} from "../../../../domain/tic-tac-toe/rules.js"
import { TicTacToeMatrix } from "../../../../domain/tic-tac-toe/TicTacToeMatrix.js"
import { TicTacToeMove } from "../../../../domain/tic-tac-toe/TicTacToeMove.js"
import { TicTacToeSymbol } from "../../../../domain/tic-tac-toe/TicTacToeSymbol.js"
import { TicTacToeStrategy } from "./TicTacToeStrategy.js"

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
