export type State = { type: string }
export type NonFinalState<S extends State> = Exclude<S, { type: "done" }>
export type FinalState<S extends State> = Extract<S, { type: "done" }>

export function isFinal<S extends State>(state: S): state is FinalState<S> {
    return state.type === "done"
}

export function isNonFinal<S extends State>(
    state: S,
): state is NonFinalState<S> {
    return !isFinal(state)
}
