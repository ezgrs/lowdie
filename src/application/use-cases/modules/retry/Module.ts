import { Module } from "../../../ports/Module.js"
import { NonFinalState, State } from "../../../../domain/entities/State.js"
import { isFinal, isNonFinal } from "../../../../domain/services/State.js"
import { isRetryEvent, newRetryEvent, RetryModuleEvent } from "./Event.js"
import { RetryModuleState } from "./State.js"
import { Action } from "../../../../domain/entities/Action.js"
import { UnexpectedModuleFlow } from "../../../../domain/entities/errors.js"
import { Event } from "../../../../domain/entities/Event.js"

export class RetryModule<S extends State, E extends Event> implements Module<
    RetryModuleState<S>,
    RetryModuleEvent<E>
> {
    constructor(private module: Module<S, E>) {}

    getInitialState(): NonFinalState<RetryModuleState<S>> {
        return { type: "active", wrapped: this.module.getInitialState() }
    }

    applyEvent(
        state: NonFinalState<RetryModuleState<NonFinalState<S>>>,
        event: RetryModuleEvent<E>,
    ): RetryModuleState<S> {
        if (isRetryEvent(event)) {
            switch (event.type) {
                case "userProceeded":
                    switch (state.type) {
                        case "waiting":
                            return this.getInitialState()
                    }
                    throw new UnexpectedModuleFlow(event.type, state.type)
                case "userCanceled":
                    switch (state.type) {
                        case "waiting":
                            return { type: "done", wrapped: state.wrapped }
                    }
                    throw new UnexpectedModuleFlow(event.type, state.type)
            }
        }
        const newState = this.module.applyEvent(state.wrapped, event)
        if (isNonFinal(newState)) {
            return { type: "active", wrapped: newState }
        }
        if (isFinal(newState)) {
            return { type: "waiting", wrapped: newState }
        }
        throw new Error()
    }

    getAction(
        state: NonFinalState<RetryModuleState<S>>,
    ): Action<RetryModuleEvent<E>> {
        switch (state.type) {
            case "active":
                return this.module.getAction(state.wrapped)
            case "waiting":
                return {
                    type: "select",
                    choices: [
                        newRetryEvent({ type: "userProceeded" }),
                        newRetryEvent({ type: "userCanceled" }),
                    ],
                }
        }
    }
}
