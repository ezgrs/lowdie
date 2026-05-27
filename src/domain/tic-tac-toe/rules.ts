import { GameResult } from "@/domain/GameResult.js"
import { TicTacToeAxis } from "./TicTacToeAxis.js"
import { TicTacToeMatrix } from "./TicTacToeMatrix.js"
import { TicTacToeMatrixLocation } from "./TicTacToeMatrixLocation.js"
import { TicTacToeSymbol } from "./TicTacToeSymbol.js"

export function oppositeSymbolOf(symbol: TicTacToeSymbol): TicTacToeSymbol {
    return symbol === "X" ? "O" : "X"
}

export function gameResultOf(
    matrix: TicTacToeMatrix,
    playerSymbol: TicTacToeSymbol,
): GameResult | null {
    let hasEmptySpaces = false
    for (const axis of axesOf(matrix)) {
        const symbols = axis.locations.map((location) => location.symbol)

        if (!hasEmptySpaces) {
            hasEmptySpaces = symbols.some((symbol) => symbol == null)
        }

        const winningSymbol = symbols.reduce((acc, symbol) => {
            if (acc == null) return null
            if (symbol == null) return null
            if (acc !== symbol) return null
            return symbol
        })
        if (winningSymbol == null) continue
        if (playerSymbol === winningSymbol) return "win"
        return "lose"
    }
    if (hasEmptySpaces) return null
    return "draw"
}

export function* axesOf(matrix: TicTacToeMatrix): Generator<TicTacToeAxis> {
    // Yield rows
    for (let r = 0; r < 3; r++) {
        const locations: TicTacToeMatrixLocation[] = []
        for (let c = 0; c < 3; c++) {
            locations.push({
                symbol: matrix[r]?.[c] ?? null,
                row: r,
                col: c,
            })
        }
        yield {
            orientation: "horizontal",
            locations: [locations[0]!, locations[1]!, locations[2]!],
        }
    }

    // Yield columns
    for (let c = 0; c < 3; c++) {
        const locations: TicTacToeMatrixLocation[] = []
        for (let r = 0; r < 3; r++) {
            locations.push({
                symbol: matrix[r]?.[c] ?? null,
                row: r,
                col: c,
            })
        }
        yield {
            orientation: "vertical",
            locations: [locations[0]!, locations[1]!, locations[2]!],
        }
    }

    // Yield diagonals
    for (let i = 0; i < 2; i++) {
        const locations: TicTacToeMatrixLocation[] = []
        for (let j = 0; j < 3; j++) {
            const r = j
            const c = 2 * i * (1 - j) + j
            locations.push({
                symbol: matrix[r]?.[c] ?? null,
                row: r,
                col: c,
            })
        }
        yield {
            orientation: "diagonal",
            locations: [locations[0]!, locations[1]!, locations[2]!],
        }
    }
}
