import { Action } from "@/src/domain/entities/Action.js"
import { NonFinalState, State } from "@/src/domain/entities/State.js"

export interface Module<S extends State, E> {
    getInitialState(): NonFinalState<S>
    applyEvent(state: NonFinalState<S>, event: E): S
    getAction(state: NonFinalState<S>): Action<E>
}
