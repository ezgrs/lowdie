import { DiscriminatedUnion } from "@/src/common/utils.js"
import { GameResult } from "@/src/domain/entities/GameResult.js"
import {
    TicTacToeDifficulty,
    TicTacToeSymbol,
} from "@/src/domain/entities/TicTacToe.js"
import { TicTacToeBoard } from "@/src/domain/services/tic-tac-toe/board.js"
import { TicTacToeStrategy } from "@/src/domain/services/tic-tac-toe/strategy.js"

export type TicTacToeGameState = DiscriminatedUnion<{
    settingUp: {
        playerSymbol: TicTacToeSymbol
        difficulty: TicTacToeDifficulty
        property: "playerSymbol" | "difficulty" | undefined
    }
    playing: {
        playerSymbol: TicTacToeSymbol
        strategy: TicTacToeStrategy
        board: TicTacToeBoard
    }
    done: {
        result: GameResult
    }
}>
