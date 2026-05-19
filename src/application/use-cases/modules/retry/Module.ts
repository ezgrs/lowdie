import { Module } from "@/src/application/ports/Module.js"
import { NonFinalState, State } from "@/src/domain/entities/State.js"
import { isFinal, isNonFinal } from "@/src/domain/services/State.js"
import { Action } from "@/src/domain/entities/Action.js"
import { UnexpectedModuleFlow } from "@/src/domain/entities/errors.js"
import { Event } from "@/src/domain/entities/Event.js"
import { RetryModuleState } from "./State.js"
import {
    isRetryModuleEvent,
    newRetryModuleEvent,
    RetryModuleEvent,
} from "./Event.js"

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
        if (isRetryModuleEvent(event)) {
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
                        newRetryModuleEvent({ type: "userProceeded" }),
                        newRetryModuleEvent({ type: "userCanceled" }),
                    ],
                }
        }
    }
}
