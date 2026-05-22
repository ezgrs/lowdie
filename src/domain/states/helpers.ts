import { State, FinalState, NonFinalState } from "./State.js"

export function isFinal<S extends State>(state: S): state is FinalState<S> {
    return state.type === "done"
}

export function isNonFinal<S extends State>(
    state: S,
): state is NonFinalState<S> {
    return !isFinal(state)
}
