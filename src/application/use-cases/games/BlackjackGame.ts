import { Prompt } from "@/application/ports/Prompt.js"
import { Randomizer } from "@/application/ports/Randomizer.js"
import { GameResult } from "@/domain/GameResult.js"
import { Game } from "@/domain/modules/Game.js"
import { BlackjackGameState } from "@/domain/states/BlackjackGameState.js"
import { BlackjackGameEvent } from "@/domain/events/BlackjackGameEvent.js"
import { FinalState, NonFinalState } from "@/domain/states/State.js"
import { BlackjackCard } from "@/domain/blackjack/BlackjackCard.js"
import { totalOf } from "@/domain/blackjack/rules.js"

type Args = {
    randomizer: Randomizer
}

const cards: BlackjackCard[] = ["A", 2, 3, 4, 5, 6, 7, 8, 9, "J", "Q", "K"]

export class BlackjackGame implements Game<
    BlackjackGameState,
    BlackjackGameEvent
> {
    private readonly randomizer: Randomizer

    constructor(args: Args) {
        this.randomizer = args.randomizer
    }

    gameResultOf(state: FinalState<BlackjackGameState>): GameResult {
        return state.result
    }

    getInitialState(): NonFinalState<BlackjackGameState> {
        return {
            type: "playing",
            dealerUpCard: this.randomizer.choose(cards),
            playerCards: Array.from({ length: 2 }, () =>
                this.randomizer.choose(cards),
            ),
        }
    }

    applyEvent(
        state: NonFinalState<BlackjackGameState>,
        event: BlackjackGameEvent,
    ): BlackjackGameState {
        let userTotal: number
        let dealerTotal: number
        let dealerCards: BlackjackCard[]
        switch (event.type) {
            case "userHit":
                if (state.type !== "playing") throw 1
                const playerCards = [
                    ...state.playerCards,
                    this.randomizer.choose(cards),
                ]
                const total = totalOf(playerCards)
                if (total === 21) {
                    return {
                        type: "done",
                        result: "win",
                        playerCards: playerCards,
                        dealerCards: [state.dealerUpCard],
                    } // Player blackjacks
                }
                if (total > 21) {
                    return {
                        type: "done",
                        result: "lose",
                        playerCards: playerCards,
                        dealerCards: [state.dealerUpCard],
                    } // Player busts
                }
                return {
                    type: "playing",
                    dealerUpCard: state.dealerUpCard,
                    playerCards: playerCards,
                }
            case "userStand":
                if (state.type !== "playing") throw 1
                const dealerHoleCard = this.randomizer.choose(cards)
                userTotal = totalOf(state.playerCards)
                dealerCards = [state.dealerUpCard, dealerHoleCard]
                dealerTotal = totalOf(dealerCards)
                if (dealerTotal > 21) {
                    return {
                        type: "done",
                        result: "win",
                        playerCards: state.playerCards,
                        dealerCards: dealerCards,
                    } // Dealer busts
                }
                if (dealerTotal === 21) {
                    if (userTotal < 21) {
                        return {
                            type: "done",
                            result: "lose",
                            playerCards: state.playerCards,
                            dealerCards: dealerCards,
                        } // Dealer reaches 21 first
                    }
                    if (state.playerCards.length === 2) {
                        return {
                            type: "done",
                            result: "draw",
                            playerCards: state.playerCards,
                            dealerCards: dealerCards,
                        } // Both reaches blackjack first
                    }
                    return {
                        type: "done",
                        result: "lose",
                        playerCards: state.playerCards,
                        dealerCards: dealerCards,
                    } // Both reaches 21, but not a natural blackjack
                }
                return {
                    type: "waiting",
                    dealerUpCard: state.dealerUpCard,
                    playerCards: state.playerCards,
                    dealerHoleCard: dealerHoleCard,
                    dealerCards: [],
                }
            case "dealerProceeds":
                if (state.type !== "waiting") throw 1
                const dealerCard = this.randomizer.choose(cards)
                userTotal = totalOf(state.playerCards)
                dealerCards = [
                    state.dealerUpCard,
                    state.dealerHoleCard,
                    ...state.dealerCards,
                    dealerCard,
                ]
                dealerTotal = totalOf(dealerCards)
                if (dealerTotal > 21) {
                    return {
                        type: "done",
                        result: "win",
                        playerCards: state.playerCards,
                        dealerCards: dealerCards,
                    } // Dealer busts
                }
                if (dealerTotal === 21) {
                    if (userTotal === 21) {
                        return {
                            type: "done",
                            result: "draw",
                            playerCards: state.playerCards,
                            dealerCards: dealerCards,
                        }
                    }
                    return {
                        type: "done",
                        result: "lose",
                        playerCards: state.playerCards,
                        dealerCards: dealerCards,
                    }
                }
                if (dealerTotal >= 17) {
                    if (dealerTotal > userTotal) {
                        return {
                            type: "done",
                            result: "lose",
                            playerCards: state.playerCards,
                            dealerCards: dealerCards,
                        }
                    }
                    if (dealerTotal < userTotal) {
                        return {
                            type: "done",
                            result: "win",
                            playerCards: state.playerCards,
                            dealerCards: dealerCards,
                        }
                    }
                    return {
                        type: "done",
                        result: "draw",
                        playerCards: state.playerCards,
                        dealerCards: dealerCards,
                    }
                }
                return {
                    type: "waiting",
                    dealerUpCard: state.dealerUpCard,
                    playerCards: state.playerCards,
                    dealerHoleCard: state.dealerHoleCard,
                    dealerCards: [...state.dealerCards, dealerCard],
                }
        }
    }

    getPrompt(
        state: NonFinalState<BlackjackGameState>,
    ): Prompt<BlackjackGameEvent> {
        switch (state.type) {
            case "playing":
                return {
                    type: "select",
                    choices: [{ type: "userHit" }, { type: "userStand" }],
                }
            case "waiting":
                return {
                    type: "select",
                    choices: [{ type: "dealerProceeds" }],
                }
        }
    }
}
