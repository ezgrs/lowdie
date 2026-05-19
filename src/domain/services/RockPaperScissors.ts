import { GameResult } from "@/src/domain/entities/GameResult.js"
import { Move } from "@/src/domain/entities/RockPaperScissors.js"

export function evaluateGame(botMove: Move, userMove: Move): GameResult {
    if (botMove === userMove) {
        return "draw"
    }
    if (
        (botMove === "rock" && userMove === "scissors") ||
        (botMove === "paper" && userMove === "rock") ||
        (botMove === "scissors" && userMove === "paper")
    ) {
        return "lose"
    }
    return "win"
}
