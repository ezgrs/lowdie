import { DiscriminatedUnion } from "@/common/utils.js"
import { GameResult } from "@/domain/entities/GameResult.js"
import {
    TicTacToeDifficulty,
    TicTacToeSymbol,
} from "@/domain/entities/TicTacToe.js"
import { TicTacToeBoard } from "@/domain/services/tic-tac-toe/board.js"
import { TicTacToeStrategy } from "@/domain/services/tic-tac-toe/strategy.js"

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
