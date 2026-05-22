import { Action } from "@/domain/Action.js"
import { State, NonFinalState } from "../states/State.js"

export interface Module<S extends State, E> {
    getInitialState(): NonFinalState<S>
    applyEvent(state: NonFinalState<S>, event: E): S
    getAction(state: NonFinalState<S>): Action<E>
}
