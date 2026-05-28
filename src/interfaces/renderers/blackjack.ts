import { Renderer } from "@/application/ports/Renderer.js"
import { BlackjackCard } from "@/domain/blackjack/BlackjackCard.js"
import { totalOf } from "@/domain/blackjack/rules.js"
import { BlackjackGameEvent } from "@/domain/events/BlackjackGameEvent.js"
import { BlackjackGameState } from "@/domain/states/BlackjackGameState.js"

export class BlackjackGameRenderer implements Renderer<
    BlackjackGameState,
    BlackjackGameEvent
> {
    messagesOf(state: BlackjackGameState): string[] {
        let lastDealerCard: BlackjackCard
        let lastPlayerCard: BlackjackCard
        switch (state.type) {
            case "playing":
                const [card1, card2, ...playerCards] = state.playerCards
                const messages = []
                if (playerCards.length === 0) {
                    messages.push(
                        `Essa é a carta aberta: ${state.dealerUpCard}`,
                    )
                    messages.push(
                        `Suas cartas: ${card1} + ${card2} = ${totalOf(state.playerCards)}`,
                    )
                } else {
                    lastPlayerCard = playerCards[playerCards.length - 1]!
                    messages.push(
                        `Você recebe um ${lastPlayerCard}; total: ${totalOf(state.playerCards)}`,
                    )
                }
                messages.push("O que você deseja fazer?")
                return messages
            case "waiting":
                const dealerCards = [
                    state.dealerUpCard,
                    state.dealerHoleCard,
                    ...state.dealerCards,
                ]
                if (state.dealerCards.length === 0) {
                    return [
                        `Essa é a carta fechada: ${state.dealerHoleCard}`,
                        `Meu total é ${state.dealerUpCard} + ${state.dealerHoleCard} = ${totalOf(dealerCards)}`,
                    ]
                }
                lastDealerCard =
                    state.dealerCards[state.dealerCards.length - 1]!
                return [
                    `Recebi um ${lastDealerCard}; total: ${totalOf(dealerCards)}`,
                ]

            case "done":
                const playerTotal = totalOf(state.playerCards)
                const dealerTotal = totalOf(state.dealerCards)
                switch (state.result) {
                    case "win":
                        if (
                            playerTotal === 21 &&
                            state.playerCards.length === 2
                        ) {
                            return ["Blackjack! Você venceu com 21."]
                        }
                        lastDealerCard =
                            state.dealerCards[state.dealerCards.length - 1]!
                        return [
                            `Recebi um ${lastDealerCard}; total: ${totalOf(state.dealerCards)}`,
                            `Você venceu!`,
                        ]
                    case "lose":
                        if (playerTotal > 21) {
                            lastPlayerCard =
                                state.playerCards[state.playerCards.length - 1]!
                            return [
                                `Você recebe um ${lastPlayerCard}; total: ${totalOf(state.playerCards)}`,
                                `Você estourou!`,
                            ]
                        }
                        if (
                            dealerTotal === 21 &&
                            state.dealerCards.length === 2
                        ) {
                            return [
                                `Que sorte! Minhas cartas foram ${state.dealerCards.join(", ")}, um blackjack! Ganhei!`,
                            ]
                        }
                        lastDealerCard =
                            state.dealerCards[state.dealerCards.length - 1]!
                        return [
                            `Recebi um ${lastDealerCard}; total: ${totalOf(state.dealerCards)}`,
                            `Eu ganhei!`,
                        ]
                    case "draw":
                        return [`Empate! Ambos com ${playerTotal}`]
                }
        }
    }

    choiceLabelOf(_: BlackjackGameState, event: BlackjackGameEvent): string {
        switch (event.type) {
            case "userHit":
                return "Mais uma"
            case "userStand":
                return "Parar"
            case "dealerProceeds":
                return "Prosseguir"
        }
    }
}
