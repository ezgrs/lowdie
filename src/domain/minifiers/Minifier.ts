import { State } from "../states/State.js"
import { Event } from "../events/Event.js"

export interface Minifier<S extends State, E extends Event, ME> {
    encode(state: S, event: E): ME
    decode(state: S, value: ME): E
}
