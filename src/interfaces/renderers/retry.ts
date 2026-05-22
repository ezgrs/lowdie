import { Renderer } from "@/application/ports/Renderer.js"
import { State } from "@/domain/states/State.js"
import { Event } from "@/domain/events/Event.js"
import { t } from "@/interfaces/i18n/index.js"
import {
    RetryModuleEvent,
    isRetryModuleEvent,
} from "@/domain/events/RetryModuleEvent.js"
import { RetryModuleState } from "@/domain/states/RetryModuleState.js"

export class RetryModuleRenderer<
    S extends State,
    E extends Event,
> implements Renderer<RetryModuleState<S>, RetryModuleEvent<E>> {
    constructor(private readonly renderer: Renderer<S, E>) {}
    choiceLabelOf(
        state: RetryModuleState<S>,
        event: RetryModuleEvent<E>,
    ): string {
        if (isRetryModuleEvent(event)) {
            switch (event.type) {
                case "userProceeded":
                    return t("common:yes")
                case "userCanceled":
                    return t("common:no")
            }
        }
        return this.renderer.choiceLabelOf(state.wrapped, event)
    }
    messagesOf(state: RetryModuleState<S>): string[] {
        const messages = [...this.renderer.messagesOf(state.wrapped)]
        switch (state.type) {
            case "active":
                break
            case "done":
                return []
            case "waiting":
                messages.push(t("bot:retry.prompt"))
        }
        return messages
    }
}
