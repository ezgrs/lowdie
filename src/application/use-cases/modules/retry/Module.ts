import { Module } from "../../../ports/Module.js"
import { NonFinalState, State } from "../../../../domain/entities/State.js"
import { isFinal, isNonFinal } from "../../../../domain/services/State.js"
import { RetryModuleEvent } from "./Event.js"
import { RetryModuleState } from "./State.js"
import { Action } from "../../../../domain/entities/Action.js"
import { UnexpectedModuleFlow } from "../../../../domain/entities/errors.js"

export class RetryModule<S extends State, E> implements Module<
    RetryModuleState<S>,
    RetryModuleEvent<E>
> {
    constructor(private module: Module<S, E>) {}

    getInitialState(): NonFinalState<RetryModuleState<S>> {
        return { type: "active", wrapped: this.module.getInitialState() }
    }

    applyEvent(
        state: NonFinalState<RetryModuleState<S>>,
        event: RetryModuleEvent<E>,
    ): RetryModuleState<S> {
        switch (event.type) {
            case "subEventEmitted":
                switch (state.type) {
                    case "active":
                        const newState = this.module.applyEvent(
                            state.wrapped,
                            event.wrapped,
                        )
                        if (isNonFinal(newState)) {
                            return { type: "active", wrapped: newState }
                        }
                        if (isFinal(newState)) {
                            return { type: "waiting", wrapped: newState }
                        }
                }
                throw new UnexpectedModuleFlow(event.type, state.type)
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

    getAction(
        state: NonFinalState<RetryModuleState<S>>,
    ): Action<RetryModuleEvent<E>> {
        switch (state.type) {
            case "active":
                const action = this.module.getAction(state.wrapped)
                switch (action.type) {
                    case "select":
                        return {
                            type: "select",
                            choices: action.choices.map((subEvent) => ({
                                type: "subEventEmitted",
                                wrapped: subEvent,
                            })),
                        }
                    case "input":
                        return {
                            type: "input",
                            parser: (input: string) => {
                                const wrapped = action.parser(input)
                                if (wrapped == null) return null
                                return {
                                    type: "subEventEmitted",
                                    wrapped: wrapped,
                                }
                            },
                        }
                }
            case "waiting":
                return {
                    type: "select",
                    choices: [
                        { type: "userProceeded" },
                        { type: "userCanceled" },
                    ],
                }
        }
    }
}
