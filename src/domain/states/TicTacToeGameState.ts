import { DiscriminatedUnion } from "@/common/utils.js"
import { GameResult } from "@/domain/GameResult.js"
import { TicTacToeBoard } from "../../application/use-cases/TicTacToeBoard.js"
import { TicTacToeSymbol } from "../tic-tac-toe/TicTacToeSymbol.js"
import { TicTacToeDifficulty } from "../tic-tac-toe/TicTacToeDifficulty.js"
import { TicTacToeStrategy } from "../tic-tac-toe/strategies/TicTacToeStrategy.js"

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
