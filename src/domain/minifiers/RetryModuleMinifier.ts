import { Minifier } from "@/application/use-cases/modules/minified.js"
import {
    isRetryModuleEvent,
    newRetryModuleEvent,
    RetryModuleEvent,
} from "@/application/use-cases/modules/retry/Event.js"
import { RetryModuleState } from "@/application/use-cases/modules/retry/State.js"
import { State } from "@/domain/entities/State.js"
import { Event } from "@/domain/entities/Event.js"

type MinifiedRetryModuleEvent = "retry_p" | "retry_c"

export class RetryModuleMinifier<
    S extends State,
    E extends Event,
    ME,
> implements Minifier<
    RetryModuleState<S>,
    RetryModuleEvent<E>,
    MinifiedRetryModuleEvent | ME
> {
    constructor(private readonly minifier: Minifier<S, E, ME>) {}

    encode(
        state: RetryModuleState<S>,
        event: RetryModuleEvent<E>,
    ): MinifiedRetryModuleEvent | ME {
        if (isRetryModuleEvent(event)) {
            switch (event.type) {
                case "userProceeded":
                    return "retry_p"
                case "userCanceled":
                    return "retry_c"
            }
        }
        return this.minifier.encode(state.wrapped, event)
    }

    decode(
        state: RetryModuleState<S>,
        value: MinifiedRetryModuleEvent | ME,
    ): RetryModuleEvent<E> {
        switch (value) {
            case "retry_c":
                return newRetryModuleEvent({ type: "userCanceled" })
            case "retry_p":
                return newRetryModuleEvent({ type: "userProceeded" })
        }
        return this.minifier.decode(state.wrapped, value)
    }
}
