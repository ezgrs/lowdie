import { Action } from "@/domain/entities/Action.js"
import { Event } from "@/domain/entities/Event.js"
import { NonFinalState, State } from "@/domain/entities/State.js"

export interface Module<S extends State, E extends Event> {
    getInitialState(): NonFinalState<S>
    applyEvent(state: NonFinalState<S>, event: E): S
    getAction(state: NonFinalState<S>): Action<E>
}
