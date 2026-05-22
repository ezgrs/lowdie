import { TicTacToeAxisOrientation } from "./TicTacToeAxisOrientationt.js"
import { TicTacToeMatrixLocation } from "./TicTacToeMatrixLocation.js"

export type TicTacToeAxis = {
    orientation: TicTacToeAxisOrientation
    locations: [
        TicTacToeMatrixLocation,
        TicTacToeMatrixLocation,
        TicTacToeMatrixLocation,
    ]
}
