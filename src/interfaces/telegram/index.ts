import { Telegraf } from "telegraf"
import { TelegramBot } from "../../infrastructure/services/interaction-channel/telegram.js"
import { runBot } from "../common/runner.js"
import { PseudoRandomizer } from "../../infrastructure/services/randomizer/pseudo.js"
import { TicTacToeAsciiBoardPresenter } from "../common/TicTacToeBoardPresenter.js"

async function main() {
    const randomizer = new PseudoRandomizer()
    const ticTacToeBoardPresenter = new TicTacToeAsciiBoardPresenter()
    const telegraf = new Telegraf(
        
    )
    new TelegramBot({
        bot: telegraf,
        onStart(channel) {
            runBot({
                randomizer: randomizer,
                channel: channel,
                ticTacToeBoardPresenter: ticTacToeBoardPresenter,
            })
        },
    })
    process.once("SIGINT", () => telegraf.stop("SIGINT"))
    process.once("SIGTERM", () => telegraf.stop("SIGTERM"))
    await telegraf.launch()
}

main()
