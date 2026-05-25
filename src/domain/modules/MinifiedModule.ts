import { Event } from "@/domain/events/Event.js"
import { Minifier } from "../minifiers/Minifier.js"
import { NonFinalState, State } from "../states/State.js"
import { Module } from "./Module.js"
import { Prompt } from "@/application/ports/Prompt.js"

type Args<S extends State, E extends Event, ME> = {
    module: Module<S, E>
    minifier: Minifier<S, E, ME>
}

export class MinifiedModule<
    S extends State,
    E extends Event,
    ME,
> implements Module<S, ME> {
    private readonly module: Module<S, E>
    private readonly minifier: Minifier<S, E, ME>

    constructor(args: Args<S, E, ME>) {
        this.module = args.module
        this.minifier = args.minifier
    }

    getInitialState(): NonFinalState<S> {
        return this.module.getInitialState()
    }

    applyEvent(state: NonFinalState<S>, minifiedEvent: ME): S {
        const event = this.minifier.decode(state, minifiedEvent)
        return this.module.applyEvent(state, event)
    }

    getPrompt(state: NonFinalState<S>): Prompt<ME> {
        const prompt = this.module.getPrompt(state)
        switch (prompt.type) {
            case "select":
                return {
                    type: "select",
                    choices: prompt.choices.map((event) =>
                        this.minifier.encode(state, event),
                    ),
                }
            case "input":
                return {
                    type: "input",
                    parser: (input) => {
                        const event = prompt.parser(input)
                        if (event == null) return null
                        return this.minifier.encode(state, event)
                    },
                }
        }
    }
}
