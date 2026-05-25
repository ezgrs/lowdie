import { RenderedPrompt } from "./Prompt.js"

export type InteractionChoice<T> = {
    value: T
    label: string
}

export type PromptOutput<E> =
    | { type: "done" }
    | { type: "invalid" }
    | { type: "proceed"; value: E }

export interface Chat<E> {
    send(message: string): Promise<void>
    ask(prompt: RenderedPrompt<E>, message: string): Promise<PromptOutput<E>>
}
