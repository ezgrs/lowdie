export type TicTacToeDifficulty = "easy" | "normal" | "hard"
export type TicTacToeSymbol = "X" | "O"
export type TicTacToeMatrix = Array<Array<TicTacToeSymbol | null>>
export type TicTacToeMatrixLocation = {
    symbol: TicTacToeSymbol | null
    row: number
    col: number
}
export type TicTacToeAxisOrientation = "horizontal" | "vertical" | "diagonal"
export type TicTacToeAxis = {
    orientation: TicTacToeAxisOrientation
    locations: [
        TicTacToeMatrixLocation,
        TicTacToeMatrixLocation,
        TicTacToeMatrixLocation,
    ]
}
export type TicTacToeMove =
    | { type: "random" }
    | { type: "exact"; coordinates: [number, number] }
