import { PseudoRandomizer } from "@/infrastructure/services/randomizers/pseudo.js"
import dotenv from "dotenv"
import { botSpecOf } from "@/interfaces/common/specs.js"
import { TicTacToeAsciiBoardPresenter } from "@/interfaces/common/TicTacToeBoardPresenter.js"
import { telegrafOf } from "@/interfaces/telegram/telegraf.js"
import { TelegramChat } from "@/infrastructure/services/chats/telegram.js"
import { TimeExpiringChat } from "@/application/use-cases/chats/TimeExpiringChat.js"
import { Chat } from "@/application/ports/Chat.js"
import { SignalCancellabelChat } from "@/application/use-cases/chats/SignalCancellableChat.js"
import { BotEvent } from "@/domain/events/BotEvent.js"
import { MemoryConsumer } from "@/application/use-cases/consumers/MemoryConsumer.js"
import { BotState } from "@/domain/states/BotState.js"
import { Event } from "@/domain/events/Event.js"
import { Consumer } from "@/application/ports/Consumer.js"
import { ChatConsumer } from "@/application/use-cases/consumers/ChatConsumer.js"
import { PendingChat } from "@/application/use-cases/chats/PendingChat.js"
import { TriggeringInbox } from "@/application/use-cases/inboxes/TriggeringInbox.js"
import { isNonFinal } from "@/domain/states/helpers.js"

async function main() {
    dotenv.config()

    const abortController = new AbortController()
    const spec = botSpecOf(
        new PseudoRandomizer(),
        new TicTacToeAsciiBoardPresenter(),
    )
    const consumer_: Consumer<BotState> = new MemoryConsumer()

    const telegraf = telegrafOf({
        token: process.env["TELEGRAM_BOT_TOKEN"]!,
        create: (telegram, chatId) => {
            let chat_: Chat<BotEvent<Event>> = new TelegramChat(telegram, chatId)
            chat_ = new TimeExpiringChat(chat_, 60_000) // 10 minutes
            chat_ = new SignalCancellabelChat(chat_, abortController.signal)
            const chat = new PendingChat(chat_, {
                async do(event) {
                    if (event == null) {
                        return await chat_.send("Invalid sate!")
                    }

                    const consumer = new ChatConsumer({
                        spec: spec,
                        chat: chat,
                        consumer: consumer_,
                    })

                    const state = await consumer.provide()
                    if (isNonFinal(state)) {
                        const nextState = spec.module.applyEvent(state, event)
                        await consumer.consume(nextState)
                    }
                },
            })

            return new TriggeringInbox({
                provider: async () => {
                    const state = await consumer_.provide()
                    if (isNonFinal(state)) {
                        return spec.module.getPrompt(state)
                    }
                    return null
                },
                trigger: {
                    async do(event) {
                        chat.resolve(event)
                    },
                },
            })
        },
    })
    for (const reason of ["SIGINT", "SIGTERM"]) {
        process.once(reason, async () => {
            abortController.abort()
            telegraf.stop(reason)
        })
    }
    await telegraf.launch()
}

main()
