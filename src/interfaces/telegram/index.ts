import { Telegraf } from "telegraf"
import { TelegramBot } from "../../infrastructure/services/interaction-channel/telegram.js"
import { runBot } from "../common/runner.js"
import { PseudoRandomizer } from "../../infrastructure/services/randomizer/pseudo.js"
import { TicTacToeAsciiBoardPresenter } from "../common/TicTacToeBoardPresenter.js"
import dotenv from "dotenv"

async function main() {
    dotenv.config()

    const abortController = new AbortController()

    const randomizer = new PseudoRandomizer()
    const ticTacToeBoardPresenter = new TicTacToeAsciiBoardPresenter()
    const telegraf = new Telegraf(process.env["TELEGRAM_BOT_TOKEN"]!)
    const bot = new TelegramBot({
        telegraf: telegraf,
        async onStart(channel) {
            await runBot({
                randomizer: randomizer,
                channel: channel,
                ticTacToeBoardPresenter: ticTacToeBoardPresenter,
                signal: abortController.signal,
                sessionTtlMs: 600_000, // 10 minutes
            })
        },
    })
    for (const reason of ["SIGINT", "SIGTERM"]) {
        process.once(reason, async () => {
            abortController.abort()
            await bot.dispose(reason)
        })
    }
    await telegraf.launch()
}

main()
