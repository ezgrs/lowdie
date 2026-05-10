import { ConsoleInteractionChannel } from "../../infrastructure/services/interaction-channel/console.js"
import { PseudoRandomizer } from "../../infrastructure/services/randomizer/pseudo.js"
import { runBot } from "../common/runner.js"
import { TicTacToeAsciiBoardPresenter } from "../common/TicTacToeBoardPresenter.js"

async function main() {
    await runBot({
        randomizer: new PseudoRandomizer(),
        channel: new ConsoleInteractionChannel(process.stdin, process.stdout),
        ticTacToeBoardPresenter: new TicTacToeAsciiBoardPresenter(),
        signal: undefined,
        sessionTtlMs: undefined,
    })
}

main()
