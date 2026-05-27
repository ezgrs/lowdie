import { RenderedPrompt } from "./Prompt.js"

export interface Requester<E> {
    request(prompt: RenderedPrompt<E>, message: string): Promise<E | null>
}
