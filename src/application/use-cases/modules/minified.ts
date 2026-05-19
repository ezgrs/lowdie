import { Event } from "@/domain/entities/Event.js"
import { NonFinalState, State } from "@/domain/entities/State.js"
import { Module } from "@/application/ports/Module.js"
import { Action } from "@/domain/entities/Action.js"

export interface Minifier<S extends State, E extends Event, ME> {
    encode(state: S, event: E): ME
    decode(state: S, value: ME): E
}

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

    getAction(state: NonFinalState<S>): Action<ME> {
        const action = this.module.getAction(state)
        switch (action.type) {
            case "select":
                return {
                    type: "select",
                    choices: action.choices.map((event) =>
                        this.minifier.encode(state, event),
                    ),
                }
            case "input":
                return {
                    type: "input",
                    parser: (input) => {
                        const event = action.parser(input)
                        if (event == null) return null
                        return this.minifier.encode(state, event)
                    },
                }
        }
    }
}
