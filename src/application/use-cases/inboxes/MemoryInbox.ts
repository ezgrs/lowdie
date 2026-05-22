import {
    Chat,
    InteractionChoice,
    InteractionOptions,
} from "@/application/ports/Chat.js"
import { Inbox } from "@/application/use-cases/inboxes/Inbox.js"
import { SessionReplacedError } from "@/domain/errors/SessionReplacedError.js"
import { SessionTimeoutError } from "@/domain/errors/SessionTimeoutError.js"

type PendingInteractionBase<T> = {
    resolve: (value: T) => void
    reject: (err: Error) => void
}
type PendingTextInteraction = PendingInteractionBase<string> & { type: "text" }
type PendingChoicesInteraction<T> = PendingInteractionBase<T> & {
    type: "choices"
    choices: Map<string, T>
}
type PendingInteraction<T> =
    | PendingTextInteraction
    | PendingChoicesInteraction<T>

type Executor<T> = (
    resolve: (v: T) => void,
    reject: (e: unknown) => void,
) => void

function withTimeout<T>(timeoutMs: number, executor: Executor<T>): Executor<T> {
    return (resolve, reject) => {
        let settled = false

        const timer = setTimeout(() => {
            if (settled) return
            settled = true
            reject(new SessionTimeoutError())
        }, timeoutMs)

        const safeResolve = (value: T) => {
            if (settled) return
            settled = true
            clearTimeout(timer)
            resolve(value)
        }

        const safeReject = (err?: unknown) => {
            if (settled) return
            settled = true
            clearTimeout(timer)
            reject(err)
        }

        try {
            executor(safeResolve, safeReject)
        } catch (err) {
            safeReject(err)
        }
    }
}

function withAbortSignal<T>(
    signal: AbortSignal,
    executor: Executor<T>,
): Executor<T> {
    return (resolve, reject) => {
        let settled = false

        if (signal.aborted) {
            return reject(new DOMException("Aborted", "AbortError"))
        }

        const cleanup = () => {
            signal.removeEventListener("abort", onAbort)
        }

        const onAbort = () => {
            if (settled) return
            settled = true
            cleanup()
            reject(new DOMException("Aborted", "AbortError"))
        }

        signal.addEventListener("abort", onAbort)

        const safeResolve = (value: T) => {
            if (settled) return
            settled = true
            cleanup()
            resolve(value)
        }

        const safeReject = (err?: unknown) => {
            if (settled) return
            settled = true
            cleanup()
            reject(err)
        }

        try {
            executor(safeResolve, safeReject)
        } catch (err) {
            safeReject(err)
        }
    }
}

type Args = {
    chat: Chat
}

class SyncChat implements Chat {
    private pending: PendingInteraction<any> | undefined
    private readonly chat: Chat

    constructor(args: Args) {
        this.chat = args.chat
    }

    async texted(text: string): Promise<void> {
        const pending = this.pending
        if (!pending) return
        if (pending.type !== "text") return
        setTimeout(() => {
            pending.resolve(text)
            this.cleanup()
        }, 0)
    }

    async answered(data: string): Promise<void> {
        const pending = this.pending
        if (!pending) return
        if (pending.type !== "choices") return

        const value = pending.choices.get(data)
        if (value == null) return

        setTimeout(() => {
            pending.resolve(value)
            this.cleanup()
        }, 0)
    }

    async disposed(_: string): Promise<void> {
        const pending = this.pending
        if (!pending) return

        pending.reject(new SessionReplacedError())
        this.cleanup()
    }

    async send(message: string): Promise<void> {
        return await this.chat.send(message)
    }

    async askText(
        message: string,
        options?: InteractionOptions,
    ): Promise<string> {
        if (this.pending) {
            throw new Error("Another interaction is already pending")
        }

        await this.chat.askText(message, options)

        let executor: Executor<string>
        executor = (resolve, reject) => {
            this.pending = {
                type: "text",
                resolve,
                reject,
            }
        }
        if (options?.sessionTtlMs) {
            executor = withTimeout(options.sessionTtlMs, executor)
        }
        if (options?.signal) {
            executor = withAbortSignal(options.signal, executor)
        }
        return new Promise(executor)
    }

    async askChoices<T>(
        message: string,
        choices: InteractionChoice<T>[],
        options?: InteractionOptions,
    ): Promise<T> {
        if (this.pending) {
            throw new Error("Another interaction is already pending")
        }

        await this.chat.askChoices(message, choices, options)

        const choiceMap = new Map<string, T>()
        choices.forEach((choice, index) => {
            const key = `choice_${index}`
            choiceMap.set(key, choice.value)
        })

        let executor: Executor<T>
        executor = (resolve, reject) => {
            this.pending = {
                type: "choices",
                resolve,
                reject,
                choices: choiceMap,
            }
        }
        if (options?.sessionTtlMs) {
            executor = withTimeout(options.sessionTtlMs, executor)
        }
        if (options?.signal) {
            executor = withAbortSignal(options.signal, executor)
        }
        return new Promise(executor)
    }

    private cleanup(): void {
        this.pending = undefined
    }
}

export class MemoryInbox implements Inbox {
    private readonly chats: Map<number, SyncChat> = new Map()

    constructor(private readonly onChat: (chatId: number) => Chat) {}

    async started(chatId: number): Promise<void> {
        const session = this.chats.get(chatId)
        if (session != null) {
            session.disposed("")
            this.chats.delete(chatId)
        }
        const chat = this.onChat(chatId)
        this.chats.set(chatId, new SyncChat({ chat }))
    }

    async texted(chatId: number, text: string): Promise<void> {
        const chat = this.chats.get(chatId)
        if (chat == null) return
        await chat.texted(text)
    }

    async answered(chatId: number, data: string): Promise<void> {
        const chat = this.chats.get(chatId)
        if (chat == null) return
        await chat.answered(data)
    }

    async disposed(): Promise<void> {}
}
