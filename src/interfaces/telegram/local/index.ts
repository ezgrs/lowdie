import { PseudoRandomizer } from "@/infrastructure/services/randomizer/pseudo.js"
import dotenv from "dotenv"
import { runModuleLoop, botSpecOf } from "@/interfaces/common/runner.js"
import { TicTacToeAsciiBoardPresenter } from "@/interfaces/common/TicTacToeBoardPresenter.js"
import { telegrafOf } from "@/interfaces/telegram/telegraf.js"
import { TelegramInteractionChannel } from "@/infrastructure/services/interaction-channel/telegram.js"
import { MemoryBasedAgent } from "@/infrastructure/services/agent/memory.js"
import { InteractionChannelBasedAgent } from "@/infrastructure/services/agent/interaction-channel.js"

async function main() {
    dotenv.config()

    const abortController = new AbortController()

    const [telegraf, bot] = telegrafOf({
        token: process.env["TELEGRAM_BOT_TOKEN"]!,
        createAgent: (telegram) =>
            new MemoryBasedAgent({
                onAgent: (chatId) =>
                    new InteractionChannelBasedAgent({
                        channel: new TelegramInteractionChannel(
                            telegram,
                            chatId,
                        ),
                        run: async (channel) => {
                            await runModuleLoop({
                                spec: botSpecOf(
                                    new PseudoRandomizer(),
                                    new TicTacToeAsciiBoardPresenter(),
                                ),
                                channel: channel,
                                signal: abortController.signal,
                                sessionTtlMs: 600_000, // 10 minutes
                            })
                        },
                    }),
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
