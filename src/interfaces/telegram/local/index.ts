import { PseudoRandomizer } from "@/infrastructure/services/randomizers/pseudo.js"
import dotenv from "dotenv"
import { botSpecOf } from "@/interfaces/common/specs.js"
import { TicTacToeAsciiBoardPresenter } from "@/interfaces/common/TicTacToeBoardPresenter.js"
import { telegrafOf } from "@/interfaces/telegram/telegraf.js"
import { TelegramChat } from "@/infrastructure/services/chats/telegram.js"
import { MemoryInbox } from "@/application/use-cases/inboxes/MemoryInbox.js"
import { runModuleLoop } from "@/application/use-cases/runner.js"

async function main() {
    dotenv.config()

    const abortController = new AbortController()

    const [telegraf, bot] = telegrafOf({
        token: process.env["TELEGRAM_BOT_TOKEN"]!,
        createInbox: (telegram) =>
            new MemoryInbox((chatId) => {
                const chat = new TelegramChat(telegram, chatId)
                runModuleLoop({
                    spec: botSpecOf(
                        new PseudoRandomizer(),
                        new TicTacToeAsciiBoardPresenter(),
                    ),
                    chat: chat,
                    options: {
                        signal: abortController.signal,
                        sessionTtlMs: 600000, // 10 minutes
                    },
                })
                return chat
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
