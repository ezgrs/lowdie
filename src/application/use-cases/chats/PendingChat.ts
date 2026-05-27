import { Chat } from "@/application/ports/Chat.js"
import { Prompt, RenderedPrompt } from "@/application/ports/Prompt.js"
import { Trigger } from "@/application/ports/Trigger.js"
import { Completer, createCompleter } from "@/common/Completer.js"

type Pending<E> = {
    prompt: Prompt<E>
    completer: Completer<E | null>
}

export class PendingChat<E> implements Chat<E>, Completer<E> {
    private pending: Pending<any> | undefined

    constructor(
        private readonly chat: Chat<E>,
        private readonly trigger: Trigger<E | null>,
    ) {}

    send(message: string): Promise<void> {
        return this.chat.send(message)
    }

    async ask(
        prompt: RenderedPrompt<E>,
        message: string,
    ): Promise<void> {
        await this.chat.ask(prompt, message)

        const [completer, future] = createCompleter<E | null>()
        this.pending = { completer, prompt }
        const event = await future
        await this.trigger.do(event)
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
