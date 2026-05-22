import { GameResult } from "@/domain/GameResult.js"
import { RockPaperScissorsMove } from "./RockPaperScissorsMove.js"

export function evaluateGame(
    botMove: RockPaperScissorsMove,
    userMove: RockPaperScissorsMove,
): GameResult {
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
