import { Renderer } from "@/application/ports/Renderer.js"
import { RockPaperScissorsGameEvent } from "@/application/use-cases/modules/rock-paper-scissors/Event.js"
import { RockPaperScissorsGameState } from "@/application/use-cases/modules/rock-paper-scissors/State.js"
import { evaluateGame } from "@/domain/services/RockPaperScissors.js"
import { t } from "@/interfaces/i18n/index.js"

export class RockPaperScissorsGameRenderer implements Renderer<
    RockPaperScissorsGameState,
    RockPaperScissorsGameEvent
> {
    choiceLabelOf(
        _: RockPaperScissorsGameState,
        event: RockPaperScissorsGameEvent,
    ): string {
        switch (event.type) {
            case "userChose":
                return t(`rps:${event.move}`)
        }
    }

    messagesOf(state: RockPaperScissorsGameState): string[] {
        switch (state.type) {
            case "waitingForUser":
                return []
            case "done":
                const result = evaluateGame(state.botMove, state.userMove)
                const botMoveLabel = t(`rps:${state.botMove}`)
                return [
                    t(`rps:${result}Message`, {
                        botMove: botMoveLabel,
                    }),
                ]
        }
    }
}
