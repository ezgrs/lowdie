import { State } from "@/domain/states/State.js"
import { Event } from "@/domain/events/Event.js"

export interface Renderer<S extends State, E extends Event> {
    messagesOf(state: S): string[]
    choiceLabelOf(state: S, event: E): string
}
