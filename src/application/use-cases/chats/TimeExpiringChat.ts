import { Chat } from "@/application/ports/Chat.js"
import { RenderedPrompt } from "@/application/ports/Prompt.js"
import { TimedCompleter } from "@/common/Completer.js"

export class TimeExpiringChat<E> implements Chat<E> {
    constructor(
        private readonly chat: Chat<E>,
        private readonly timeoutMs: number,
    ) {}

    send(message: string): Promise<void> {
        return this.chat.send(message)
    }

    ask(prompt: RenderedPrompt<E>, message: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const completer = new TimedCompleter<void>(
                { resolve, reject },
                this.timeoutMs,
            )
            this.chat
                .ask(prompt, message)
                .then(completer.resolve)
                .catch(completer.reject)
        })
    }
}
