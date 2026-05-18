import { runModuleLoop, botSpecOf } from "../../common/runner.js"
import { PseudoRandomizer } from "../../../infrastructure/services/randomizer/pseudo.js"
import { TicTacToeAsciiBoardPresenter } from "../../common/TicTacToeBoardPresenter.js"
import dotenv from "dotenv"
import { StatefulTelegramBot } from "../../../infrastructure/services/interaction-channel/telegram/stateful-bot.js"
import { telegrafOf } from "../../common/telegraf.js"

async function main() {
    dotenv.config()

    const abortController = new AbortController()

    const bot = new StatefulTelegramBot(async (channel) => {
        await runModuleLoop({
            spec: botSpecOf(
                new PseudoRandomizer(),
                new TicTacToeAsciiBoardPresenter(),
            ),
            channel: channel,
            signal: abortController.signal,
            sessionTtlMs: 600_000, // 10 minutes
        })
    })

    const telegraf = telegrafOf(process.env["TELEGRAM_BOT_TOKEN"]!, bot)
    for (const reason of ["SIGINT", "SIGTERM"]) {
        process.once(reason, async () => {
            abortController.abort()
            await bot.disposed()
            telegraf.stop(reason)
        })
    }
    await telegraf.launch()
}

main()
