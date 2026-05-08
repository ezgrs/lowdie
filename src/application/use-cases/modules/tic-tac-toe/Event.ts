import { DiscriminatedUnion } from "../../../../common/utils.js"
import {
    TicTacToeDifficulty,
    TicTacToeSymbol,
} from "../../../../domain/entities/TicTacToe.js"

export type TicTacToeGameEvent = DiscriminatedUnion<{
    userStartedPropertySetup: { property: "playerSymbol" | "difficulty" }
    userUpdatedProperty:
        | { property: "playerSymbol"; value: TicTacToeSymbol }
        | { property: "difficulty"; value: TicTacToeDifficulty }
    userCanceledPropertySetup: {}
    userStartedGame: {}
    userMarkedSymbol: { row: number; col: number }
}>
