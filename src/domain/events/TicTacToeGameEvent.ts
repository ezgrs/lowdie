import { DiscriminatedUnion } from "@/common/utils.js"
import { TicTacToeSymbol } from "../tic-tac-toe/TicTacToeSymbol.js"
import { TicTacToeDifficulty } from "../tic-tac-toe/TicTacToeDifficulty.js"

export type TicTacToeGameEvent = DiscriminatedUnion<{
    userStartedPropertySetup: { property: "playerSymbol" | "difficulty" }
    userUpdatedProperty:
        | { property: "playerSymbol"; value: TicTacToeSymbol }
        | { property: "difficulty"; value: TicTacToeDifficulty }
    userCanceledPropertySetup: {}
    userStartedGame: {}
    userMarkedSymbol: { row: number; col: number }
}>
