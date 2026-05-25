import { PseudoRandomizer } from "@/infrastructure/services/randomizers/pseudo.js"
import dotenv from "dotenv"
import { botSpecOf } from "@/interfaces/common/specs.js"
import { TicTacToeAsciiBoardPresenter } from "@/interfaces/common/TicTacToeBoardPresenter.js"
import { telegrafOf } from "@/interfaces/telegram/telegraf.js"
import { TelegramChat } from "@/infrastructure/services/chats/telegram.js"
import { MemoryInbox } from "@/application/use-cases/inboxes/MemoryInbox.js"
import { TimeExpiringChat } from "@/application/use-cases/chats/TimeExpiringChat.js"
import { Chat } from "@/application/ports/Chat.js"
import { SignalCancellabelChat } from "@/application/use-cases/chats/SignalCancellableChat.js"
import { BotEvent } from "@/domain/events/BotEvent.js"

async function main() {
    dotenv.config()

    const abortController = new AbortController()

    const spec = botSpecOf(
        new PseudoRandomizer(),
        new TicTacToeAsciiBoardPresenter(),
    )
    const [telegraf, bot] = telegrafOf({
        token: process.env["TELEGRAM_BOT_TOKEN"]!,
        createInbox: (telegram) =>
            new MemoryInbox({
                module: spec.module,
                onChat(chatId) {
                    let chat: Chat<BotEvent<Event>> = new TelegramChat(
                        telegram,
                        chatId,
                    )
                    chat = new TimeExpiringChat(chat, 60_000) // 10 minutes
                    chat = new SignalCancellabelChat(
                        chat,
                        abortController.signal,
                    )
                    return chat
                },
            }),
    })
    for (const reason of ["SIGINT", "SIGTERM"]) {
        process.once(reason, async () => {
            abortController.abort()
            await bot.disposed(reason)
            telegraf.stop(reason)
        })
    }
    await telegraf.launch()
}

main()
