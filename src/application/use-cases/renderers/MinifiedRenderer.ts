import { State } from "@/domain/states/State.js"
import { Event } from "@/domain/events/Event.js"
import { Renderer } from "@/application/ports/Renderer.js"
import { Minifier } from "@/domain/minifiers/Minifier.js"

type Args<S extends State, E extends Event, ME> = {
    renderer: Renderer<S, E>
    minifier: Minifier<S, E, ME>
}

export class MinifiedRenderer<
    S extends State,
    E extends Event,
    ME,
> implements Renderer<S, ME> {
    private readonly renderer: Renderer<S, E>
    private readonly minifier: Minifier<S, E, ME>

    constructor(args: Args<S, E, ME>) {
        this.renderer = args.renderer
        this.minifier = args.minifier
    }

    messagesOf(state: S): string[] {
        return this.renderer.messagesOf(state)
    }

    choiceLabelOf(state: S, minifiedEvent: ME): string {
        const event = this.minifier.decode(state, minifiedEvent)
        return this.renderer.choiceLabelOf(state, event)
    }
}
