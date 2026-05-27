import { State } from "@/domain/states/State.js"

export interface Renderer<S extends State, E> {
    messagesOf(state: S): string[]
    choiceLabelOf(state: S, event: E): string
}
