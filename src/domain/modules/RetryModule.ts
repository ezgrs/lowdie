import { Module } from "@/domain/modules/Module.js"
import { isFinal, isNonFinal } from "@/domain/states/helpers.js"
import { Event } from "@/domain/events/Event.js"
import {
    RetryModuleEvent,
    isRetryModuleEvent,
    newRetryModuleEvent,
} from "@/domain/events/RetryModuleEvent.js"
import { RetryModuleState } from "@/domain/states/RetryModuleState.js"
import { NonFinalState, State } from "../states/State.js"
import { UnexpectedModuleFlow } from "../errors/UnexpectedModuleFlowError.js"
import { Game } from "./Game.js"
import { Prompt } from "@/application/ports/Prompt.js"

export class RetryModule<S extends State, E extends Event> implements Module<
    RetryModuleState<S>,
    RetryModuleEvent<E>
> {
    constructor(private game: Game<S, E>) {}

    getInitialState(): NonFinalState<RetryModuleState<S>> {
        return {
            type: "active",
            wrapped: this.game.getInitialState(),
            stats: {
                win: 0,
                draw: 0,
                lose: 0,
            },
        }
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
                            return {
                                type: "active",
                                wrapped: this.game.getInitialState(),
                                stats: state.stats,
                            }
                    }
                    throw new UnexpectedModuleFlow(event.type, state.type)
                case "userCanceled":
                    switch (state.type) {
                        case "waiting":
                            return {
                                type: "done",
                                wrapped: state.wrapped,
                                stats: state.stats,
                            }
                    }
                    throw new UnexpectedModuleFlow(event.type, state.type)
            }
        }
        const newState = this.game.applyEvent(state.wrapped, event)
        if (isNonFinal(newState)) {
            return { type: "active", wrapped: newState, stats: state.stats }
        }
        if (isFinal(newState)) {
            const result = this.game.gameResultOf(newState)
            return {
                type: "waiting",
                wrapped: newState,
                stats: {
                    ...state.stats,
                    [result]: (state.stats[result] ?? 0) + 1,
                },
            }
        }
        throw new Error()
    }

    getPrompt(
        state: NonFinalState<RetryModuleState<S>>,
    ): Prompt<RetryModuleEvent<E>> {
        switch (state.type) {
            case "active":
                return this.game.getPrompt(state.wrapped)
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
