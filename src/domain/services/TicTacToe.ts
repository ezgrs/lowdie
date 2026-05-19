import { Randomizer } from "@/src/application/ports/Randomizer.js"
import { GameResult } from "@/src/domain/entities/GameResult.js"
import {
    TicTacToeMatrix,
    TicTacToeMatrixLocation,
    TicTacToeAxis,
    TicTacToeSymbol,
} from "@/src/domain/entities/TicTacToe.js"

export function oppositeSymbolOf(symbol: TicTacToeSymbol): TicTacToeSymbol {
    return symbol === "X" ? "O" : "X"
}

export function gameResultOf(
    matrix: TicTacToeMatrix,
    playerSymbol: TicTacToeSymbol,
): GameResult | null {
    let emptyCount = 0
    for (const axis of axesOf(matrix)) {
        const symbols = axis.locations.map((location) => location.symbol)

        const pivotSymbol = symbols[0] ?? null
        let filled = true
        for (const symbol of symbols) {
            if (symbol == null) {
                ++emptyCount
            }
            if (symbol !== pivotSymbol) {
                filled = false
                break
            }
        }
        if (!filled) continue
        if (playerSymbol === pivotSymbol) return "win"
        return "lose"
    }
    if (emptyCount === 0) return null
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

export function randomEmptyPositionOf(
    randomizer: Randomizer,
    matrix: TicTacToeMatrix,
): [number, number] | null {
    const emptyPositions: [number, number][] = []
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            if (matrix[r]![c] == null) {
                emptyPositions.push([r, c])
            }
        }
    }
    if (emptyPositions.length === 0) {
        return null
    }
    return randomizer.choose(emptyPositions)
}
