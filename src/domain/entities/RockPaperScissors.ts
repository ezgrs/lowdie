import { GameResult } from "./GameResult.js"

export const moves = ["rock", "paper", "scissors"] as const
export type Move = (typeof moves)[number]

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
