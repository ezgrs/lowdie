import { NonFinalState, State } from "@/domain/states/State.js"
import { Event } from "@/domain/events/Event.js"
import { Chat } from "../ports/Chat.js"
import { isFinal, isNonFinal } from "@/domain/states/helpers.js"
import { Module } from "@/domain/modules/Module.js"
import { Renderer } from "../ports/Renderer.js"
import { RenderedPrompt } from "../ports/Prompt.js"

export type ModuleSpec<S extends State, E extends Event> = {
    module: Module<S, E>
    renderer: Renderer<S, E>
}

class RenderedPromptModule<S extends State, E extends Event> implements Module<
    S,
    E
> {
    constructor(readonly spec: ModuleSpec<S, E>) {}

    getInitialState(): NonFinalState<S> {
        return this.spec.module.getInitialState()
    }

    applyEvent(state: NonFinalState<S>, event: E): S {
        return this.spec.module.applyEvent(state, event)
    }

    getPrompt(state: NonFinalState<S>): RenderedPrompt<E> {
        const prompt = this.spec.module.getPrompt(state)
        switch (prompt.type) {
            case "select":
                return {
                    type: "select",
                    choices: prompt.choices,
                    labels: prompt.choices.map((event) =>
                        this.spec.renderer.choiceLabelOf(state, event),
                    ),
                }
            case "input":
                return prompt
        }
    }
}

type ExecuteModuleArgs<S extends State, E extends Event> = {
    spec: ModuleSpec<S, E>
    chat: Chat
}

export async function runModuleLoop<S extends State, E extends Event>({
    spec,
    chat,
}: ExecuteModuleArgs<S, E>) {
    const module = new RenderedPromptModule(spec)
    let state: NonFinalState<S> = spec.module.getInitialState()
    for (;;) {
        const messages = module.spec.renderer.messagesOf(state)
        for (const message of messages.slice(0, -1)) {
            await chat.send(message)
        }

        const prompt = module.getPrompt(state)

        const result = await chat.ask(prompt, messages[messages.length - 1]!)
        switch (result.type) {
            case "done":
                return
            case "invalid":
                continue
            case "proceed":
                const nextState = module.applyEvent(state, result.value)
                if (isFinal(nextState)) {
                    break
                }
                if (isNonFinal(nextState)) {
                    state = nextState
                }
        }
    }
}
