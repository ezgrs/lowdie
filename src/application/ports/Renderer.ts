import { Event } from "@/domain/entities/Event.js"
import { State } from "@/domain/entities/State.js"

export interface Renderer<S extends State, E extends Event> {
    messagesOf(state: S): string[]
    choiceLabelOf(state: S, event: E): string
}
