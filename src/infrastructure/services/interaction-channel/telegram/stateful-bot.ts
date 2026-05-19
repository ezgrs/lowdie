import { Context, Telegraf } from "telegraf"
import { InteractionChannel } from "@/src/application/ports/InteractionChannel.js"
import { StatefulTelegramInteractionChannel } from "./stateful-channel.js"
import { StatelessTelegramInteractionChannel } from "./stateless-channel.js"
import { TelegramBot } from "./bot.js"

type Session = {
    channel: StatefulTelegramInteractionChannel
    runner: Promise<void>
}

export class StatefulTelegramBot implements TelegramBot {
    private readonly sessions: Map<number, Session> = new Map()

    constructor(
        private readonly onStart: (
            channel: InteractionChannel,
        ) => Promise<void>,
    ) {}

    async started(telegraf: Telegraf<Context>, chatId: number): Promise<void> {
        const session = this.sessions.get(chatId)
        if (session != null) {
            session.channel.disposeAsReplaced()
            this.sessions.delete(chatId)
        }

        const telegram = telegraf.telegram
        const channel = new StatefulTelegramInteractionChannel(
            new StatelessTelegramInteractionChannel(telegram, chatId),
        )
        this.sessions.set(chatId, {
            channel: channel,
            runner: this.onStart(channel),
        })
    }

    async texted(
        _: Telegraf<Context>,
        chatId: number,
        text: string,
    ): Promise<void> {
        const session = this.sessions.get(chatId)
        if (session == null) return
        session.channel.acceptTextResponse(text)
    }

    async answered(
        _: Telegraf<Context>,
        chatId: number,
        data: string,
    ): Promise<void> {
        const session = this.sessions.get(chatId)
        if (session == null) return
        session.channel.acceptChoiceResponse(data)
    }

    async disposed(): Promise<void> {
        await Promise.allSettled(
            Array.from(this.sessions.values()).map(async (session) => {
                await session.runner
            }),
        )
    }
}
