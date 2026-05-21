import { Renderer } from "@/application/ports/Renderer.js"
import {
    BotEvent,
    isBotEvent,
} from "@/application/use-cases/modules/bot/Event.js"
import { BotState } from "@/application/use-cases/modules/bot/State.js"
import { t } from "@/interfaces/i18n/index.js"

export class BotRenderer implements Renderer<BotState, BotEvent<any>> {
    constructor(private readonly renderers: Renderer<any, any>[]) {}

    choiceLabelOf(state: BotState, event: BotEvent<any>): string {
        if (isBotEvent(event)) {
            switch (event.type) {
                case "userSelected":
                    return [t("rps:title"), t("ttt:title")][event.index]!
            }
        }
        switch (state.type) {
            case "active":
                return this.renderers[state.index]!.choiceLabelOf(
                    state.wrapped,
                    event,
                )
            case "waiting":
            case "done":
                throw new Error()
        }
    }

    messagesOf(state: BotState): string[] {
        switch (state.type) {
            case "waiting":
                return [t("bot:menu.welcome")]
            case "done":
                return []
            case "active":
                return this.renderers[state.index]!.messagesOf(state.wrapped)
        }
    }
}
