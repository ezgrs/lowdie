import { TicTacToeSymbol } from "./TicTacToeSymbol.js"

export type TicTacToeMatrixLocation = {
    symbol: TicTacToeSymbol | null
    row: number
    col: number
}
