import { Context, Markup, Telegraf, Telegram } from "telegraf"
import {
    InteractionChannel,
    InteractionChoice,
    InteractionOptions,
} from "../../../application/ports/InteractionChannel.js"
import { message } from "telegraf/filters"

type PendingInteractionBase<T> = {
    resolve: (value: T) => void
    reject: (err: Error) => void
    timeout: NodeJS.Timeout | undefined
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
    bot: Telegraf<Context>
    onStart: (channel: InteractionChannel) => void
}

export class TelegramBot {
    private channels: Map<number, TelegramInteractionChannel> = new Map()

    constructor(readonly args: Args) {
        const bot = args.bot
        bot.start((ctx) => {
            const chatId = ctx.chat.id
            const channel = new TelegramInteractionChannel(bot.telegram, chatId)
            this.channels.set(chatId, channel)
            args.onStart(channel)
        })
        bot.on(message("text"), async (ctx) => {
            const channel = this.channels.get(ctx.chat.id)
            if (channel == null) return
            channel.acceptTextResponse(ctx.message.text)
        })
        bot.on("callback_query", async (ctx) => {
            const channel = this.channels.get(ctx.chat!.id)
            if (channel == null) return

            const data =
                "data" in ctx.callbackQuery ? ctx.callbackQuery.data : undefined

            if (!data) return
            if (!channel.acceptChoiceResponse(data)) return
            await ctx.answerCbQuery()
        })
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

        return new Promise<string>((resolve, reject) => {
            const timeout = this.createTimeout(options, reject)
            this.pending = {
                type: "text",
                resolve,
                reject,
                timeout,
            }
        })
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

        return new Promise<T>((resolve, reject) => {
            const timeout = this.createTimeout(options, reject)

            this.pending = {
                type: "choices",
                resolve,
                reject,
                choices: choiceMap,
                timeout,
            }
        })
    }

    private cleanup(): void {
        if (this.pending?.timeout) {
            clearTimeout(this.pending.timeout)
        }

        this.pending = undefined
    }

    private createTimeout(
        options: InteractionOptions | undefined,
        reject: (err: Error) => void,
    ): NodeJS.Timeout | undefined {
        if (!options?.timeoutMs) {
            return undefined
        }

        return setTimeout(() => {
            reject(new Error("Interaction timed out"))

            this.cleanup()
        }, options.timeoutMs)
    }
}
