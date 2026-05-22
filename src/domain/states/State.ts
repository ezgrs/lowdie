export type State = { type: string }
export type NonFinalState<S extends State> = Exclude<S, { type: "done" }>
export type FinalState<S extends State> = Extract<S, { type: "done" }>
