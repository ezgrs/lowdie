import { Chat } from "@/application/ports/Chat.js"
import { RenderedPrompt } from "@/application/ports/Prompt.js"
import { AbortableCompleter } from "@/common/Completer.js"

export class SignalCancellabelChat<E> implements Chat<E> {
    constructor(
        private readonly chat: Chat<E>,
        private readonly signal: AbortSignal,
    ) {}

    send(message: string): Promise<void> {
        return this.chat.send(message)
    }

    ask(prompt: RenderedPrompt<E>, message: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const completer = new AbortableCompleter<void>(
                { resolve, reject },
                this.signal,
            )
            this.chat
                .ask(prompt, message)
                .then(completer.resolve)
                .catch(completer.reject)
        })
    }
}
