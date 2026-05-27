import { RenderedPrompt } from "./Prompt.js"

export type InteractionChoice<T> = {
    value: T
    label: string
}

export interface Transmitter<E> {
    send(message: string): Promise<void>
    ask(prompt: RenderedPrompt<E>, message: string): Promise<void>
}
