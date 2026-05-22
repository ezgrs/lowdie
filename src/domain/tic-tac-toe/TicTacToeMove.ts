export type TicTacToeMove =
    | { type: "random" }
    | { type: "exact"; coordinates: [number, number] }
