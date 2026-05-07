import { Module } from "../../../ports/Module.js"
import {
    isFinal,
    isNonFinal,
    NonFinalState,
} from "../../../../domain/entities/State.js"
import { BotEvent } from "./Event.js"
import { BotState } from "./State.js"
import { Action } from "../../../../domain/entities/Action.js"

export class BotModule implements Module<BotState, BotEvent> {
    constructor(private modules: Module<any, any>[]) {}

    getInitialState(): NonFinalState<BotState> {
        return { type: "waiting" }
    }

    applyEvent(state: NonFinalState<BotState>, event: BotEvent): BotState {
        switch (event.type) {
            case "subEventEmitted":
                switch (state.type) {
                    case "waiting":
                        throw new Error()
                    case "active":
                        const module = this.modules[state.index]!
                        const newState = module.applyEvent(
                            state.wrapped,
                            event.wrapped,
                        )
                        if (isNonFinal(newState)) {
                            return {
                                type: "active",
                                index: state.index,
                                wrapped: newState,
                            }
                        }
                        if (isFinal(newState)) {
                            return { type: "waiting" }
                        }
                        throw new Error()
                }
            case "userSelected":
                switch (state.type) {
                    case "waiting":
                        return {
                            type: "active",
                            index: event.index,
                            wrapped:
                                this.modules[event.index]!.getInitialState(),
                        }
                    case "active":
                        throw new Error()
                }
        }
    }

    getAction(state: NonFinalState<BotState>): Action<BotEvent> {
        switch (state.type) {
            case "waiting":
                return {
                    type: "select",
                    choices: this.modules.map((_, index) => ({
                        type: "userSelected",
                        index,
                    })),
                }
            case "active":
                const module = this.modules[state.index]!
                const action = module.getAction(state.wrapped)
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
                            parser: (input) => ({
                                type: "subEventEmitted",
                                wrapped: action.parser(input),
                            }),
                        }
                }
        }
    }
}
