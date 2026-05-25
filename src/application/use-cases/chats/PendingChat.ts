import { Chat, PromptOutput } from "@/application/ports/Chat.js"
import { Prompt, RenderedPrompt } from "@/application/ports/Prompt.js"
import { Completer, createCompleter } from "@/common/Completer.js"

type Pending<E> = {
    prompt: Prompt<E>
    completer: Completer<E | null>
}

export class PendingChat<E> implements Chat<E>, Completer<E> {
    private pending: Pending<any> | undefined

    constructor(private readonly chat: Chat<E>) {}

    send(message: string): Promise<void> {
        return this.chat.send(message)
    }

    async ask(
        prompt: RenderedPrompt<E>,
        message: string,
    ): Promise<PromptOutput<E>> {
        await this.chat.ask(prompt, message)

        const [completer, future] = createCompleter<E | null>()
        this.pending = { completer, prompt }
        const event = await future
        if (event == null) {
            return { type: "invalid" }
        }
        return { type: "proceed", value: event }
    }

    resolve(event: E): void {
        const pending = this.pending
        if (pending == null) return
        pending.completer.resolve(event)
    }

    reject(error: any): void {
        const pending = this.pending
        if (pending == null) return
        pending.completer.reject(error)
    }
}
