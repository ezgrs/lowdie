import { DiscriminatedUnion } from "@/common/utils.js"
import { GameResult } from "@/domain/GameResult.js"
import { BlackjackCard } from "../blackjack/BlackjackCard.js"

export type BlackjackGameState = DiscriminatedUnion<{
    playing: {
        dealerUpCard: BlackjackCard
        playerCards: BlackjackCard[]
    }
    waiting: {
        dealerUpCard: BlackjackCard
        playerCards: BlackjackCard[]
        dealerHoleCard: BlackjackCard
        dealerCards: BlackjackCard[]
    }
    done: {
        result: GameResult
        playerCards: BlackjackCard[]
        dealerCards: BlackjackCard[]
    }
}>
