import {
    RetryModuleEvent,
    isRetryModuleEvent,
    newRetryModuleEvent,
} from "../events/RetryModuleEvent.js"
import { RetryModuleState } from "../states/RetryModuleState.js"
import { State } from "../states/State.js"
import { Event } from "../events/Event.js"
import { Minifier } from "./Minifier.js"

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
