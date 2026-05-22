import { Renderer } from "@/application/ports/Renderer.js"
import { RockPaperScissorsGameEvent } from "@/domain/events/RockPaperScissorsGameEvent.js"
import { evaluateGame } from "@/domain/rock-paper-scissors/rules.js"
import { RockPaperScissorsGameState } from "@/domain/states/RockPaperScissorsGameState.js"
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
