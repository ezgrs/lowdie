import { BotEvent, isBotEvent, newBotEvent } from "../events/BotEvent.js"
import { Event } from "../events/Event.js"
import { BotState } from "../states/BotState.js"
import { Minifier } from "./Minifier.js"

type MinifiedBotEvent = { bot_m: number }

export class BotMinifier implements Minifier<
    BotState,
    BotEvent<Event>,
    MinifiedBotEvent | any
> {
    constructor(private readonly minifiers: Minifier<any, any, any>[]) {}

    encode(state: BotState, event: BotEvent<Event>): MinifiedBotEvent | any {
        if (isBotEvent(event)) {
            switch (event.type) {
                case "userSelected":
                    return { bot_m: event.index }
            }
        }
        switch (state.type) {
            case "active":
                return this.minifiers[state.index]!.encode(state.wrapped, event)
        }
        throw Error(`unexpected condition: ${state.type} with ${event.type}`)
    }

    decode(state: BotState, value: MinifiedBotEvent | any): BotEvent<Event> {
        if (typeof value === "object" && value !== null && "bot_m" in value) {
            return newBotEvent({
                type: "userSelected",
                index: value.bot_m,
            })
        }
        switch (state.type) {
            case "active":
                return this.minifiers[state.index]!.decode(state.wrapped, value)
        }
        throw Error(`unexpected condition: ${state.type} with ${value}`)
    }
}
