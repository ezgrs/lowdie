import { Context, Markup, Telegraf, Telegram } from "telegraf"
import {
    InteractionChannel,
    InteractionChoice,
    InteractionOptions,
} from "../../../application/ports/InteractionChannel.js"
import { message } from "telegraf/filters"
import { SessionTimeoutError } from "../../../domain/entities/errors.js"

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

type Args = {
    telegraf: Telegraf<Context>
    onStart: (channel: InteractionChannel) => Promise<void>
}

type Session = {
    channel: TelegramInteractionChannel
    runner: Promise<void>
}

export class TelegramBot {
    private telegraf: Telegraf<Context>
    private sessions: Map<number, Session> = new Map()

    constructor(readonly args: Args) {
        this.telegraf = args.telegraf
        this.telegraf.start((ctx) => {
            const chatId = ctx.chat.id
            const channel = new TelegramInteractionChannel(
                this.telegraf.telegram,
                chatId,
            )
            this.sessions.set(chatId, {
                channel: channel,
                runner: args.onStart(channel),
            })
        })
        this.telegraf.on(message("text"), async (ctx) => {
            const session = this.sessions.get(ctx.chat.id)
            if (session == null) return
            session.channel.acceptTextResponse(ctx.message.text)
        })
        this.telegraf.on("callback_query", async (ctx) => {
            const session = this.sessions.get(ctx.chat!.id)
            if (session == null) return

            const data =
                "data" in ctx.callbackQuery ? ctx.callbackQuery.data : undefined

            if (!data) return
            if (!session.channel.acceptChoiceResponse(data)) return
            await ctx.answerCbQuery()
        })
    }

    async dispose(reason: string | undefined) {
        await Promise.allSettled(
            Array.from(this.sessions.values()).map(async (session) => {
                await session.runner
            }),
        )
        this.telegraf.stop(reason)
    }
}

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

class TelegramInteractionChannel implements InteractionChannel {
    private pending: PendingInteraction<any> | undefined

    constructor(
        private readonly telegram: Telegram,
        private readonly chatId: number,
    ) {}

    acceptTextResponse(value: string): boolean {
        const pending = this.pending
        if (!pending) return false
        if (pending.type !== "text") return false
        setTimeout(() => {
            pending.resolve(value)
            this.cleanup()
        }, 0)
        return true
    }

    acceptChoiceResponse(key: string): boolean {
        const pending = this.pending
        if (!pending) return false
        if (pending.type !== "choices") return false

        const value = pending.choices.get(key)
        if (value == null) return false

        setTimeout(() => {
            pending.resolve(value)
            this.cleanup()
        }, 0)
        return true
    }

    async send(message: string): Promise<void> {
        if (message.length == 0) return
        await this.telegram.sendMessage(this.chatId, message)
    }

    async askText(
        message: string,
        options?: InteractionOptions,
    ): Promise<string> {
        if (this.pending) {
            throw new Error("Another interaction is already pending")
        }

        await this.send(message)

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

        const choiceMap = new Map<string, T>()

        const buttons = choices.map((choice, index) => {
            const key = `choice_${index}`
            choiceMap.set(key, choice.value)
            return [Markup.button.callback(choice.label, key)]
        })

        await this.telegram.sendMessage(
            this.chatId,
            message,
            Markup.inlineKeyboard(buttons),
        )

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
