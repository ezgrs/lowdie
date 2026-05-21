import { Module } from "@/application/ports/Module.js"
import { NonFinalState, State } from "@/domain/entities/State.js"
import { Event } from "@/domain/entities/Event.js"
import { isFinal, isNonFinal } from "@/domain/services/State.js"
import { Action } from "@/domain/entities/Action.js"
import { UnexpectedModuleFlow } from "@/domain/entities/errors.js"
import { isBotEvent, newBotEvent, BotEvent } from "./Event.js"
import { BotState } from "./State.js"

export class BotModule implements Module<BotState, BotEvent<Event>> {
    constructor(private modules: Module<State, Event>[]) {}

    getInitialState(): NonFinalState<BotState> {
        return { type: "waiting" }
    }

    applyEvent(
        state: NonFinalState<BotState>,
        event: BotEvent<Event>,
    ): BotState {
        if (isBotEvent(event)) {
            switch (event.type) {
                case "userSelected":
                    switch (state.type) {
                        case "waiting":
                            return {
                                type: "active",
                                index: event.index,
                                wrapped:
                                    this.modules[
                                        event.index
                                    ]!.getInitialState(),
                            }
                        case "active":
                            throw new UnexpectedModuleFlow(
                                event.type,
                                state.type,
                            )
                    }
            }
        }
        switch (state.type) {
            case "waiting":
                throw new UnexpectedModuleFlow("", state.type)
            case "active":
                const module = this.modules[state.index]!
                const newState = module.applyEvent(state.wrapped, event)
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
                throw new UnexpectedModuleFlow("", state.type)
        }
    }

    getAction(state: NonFinalState<BotState>): Action<BotEvent<Event>> {
        switch (state.type) {
            case "waiting":
                return {
                    type: "select",
                    choices: this.modules.map((_, index) =>
                        newBotEvent({
                            type: "userSelected",
                            index,
                        }),
                    ),
                }
            case "active":
                const module = this.modules[state.index]!
                return module.getAction(state.wrapped)
        }
    }
}
