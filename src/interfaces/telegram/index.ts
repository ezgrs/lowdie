import { Telegraf } from "telegraf"
import { TelegramBot } from "../../infrastructure/services/interaction-channel/telegram.js"
import { runBot } from "../common/runner.js"
import { PseudoRandomizer } from "../../infrastructure/services/randomizer/pseudo.js"
import { TicTacToeAsciiBoardPresenter } from "../common/TicTacToeBoardPresenter.js"

async function main() {
    const abortController = new AbortController()

    const randomizer = new PseudoRandomizer()
    const ticTacToeBoardPresenter = new TicTacToeAsciiBoardPresenter()
    const telegraf = new Telegraf(
        
    )
    const bot = new TelegramBot({
        telegraf: telegraf,
        async onStart(channel) {
            await runBot({
                randomizer: randomizer,
                channel: channel,
                ticTacToeBoardPresenter: ticTacToeBoardPresenter,
                signal: abortController.signal,
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
