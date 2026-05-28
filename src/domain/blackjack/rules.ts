import { BlackjackCard } from "./BlackjackCard.js"
import { BlackjackFaceCard } from "./BlackjackFaceCard.js"

export const blackjackFaceCardValues: Record<BlackjackFaceCard, number[]> = {
    A: [1, 11],
    J: [10],
    Q: [10],
    K: [10],
}

export function totalOf(cards: BlackjackCard[]): number {
    let total = 0
    for (const card of cards) {
        if (typeof card === "number") {
            total += card
        } else {
            const values = blackjackFaceCardValues[card]
            total +=
                [...values]
                    .sort((a, b) => b - a)
                    .find((value) => total + value <= 21) ?? values[0]!
        }
    }
    return total
}
