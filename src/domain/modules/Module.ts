import { Prompt } from "@/application/ports/Prompt.js"
import { State, NonFinalState } from "../states/State.js"

export interface Module<S extends State, E> {
    getInitialState(): NonFinalState<S>
    applyEvent(state: NonFinalState<S>, event: E): S
    getPrompt(state: NonFinalState<S>): Prompt<E>
}
