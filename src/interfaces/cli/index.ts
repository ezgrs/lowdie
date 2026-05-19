import { ConsoleInteractionChannel } from "@/infrastructure/services/interaction-channel/console.js"
import { PseudoRandomizer } from "@/infrastructure/services/randomizer/pseudo.js"
import { botSpecOf, runModuleLoop } from "@/interfaces/common/runner.js"
import { TicTacToeAsciiBoardPresenter } from "@/interfaces/common/TicTacToeBoardPresenter.js"

async function main() {
    await runModuleLoop({
        spec: botSpecOf(
            new PseudoRandomizer(),
            new TicTacToeAsciiBoardPresenter(),
        ),
        channel: new ConsoleInteractionChannel(process.stdin, process.stdout),
        signal: undefined,
        sessionTtlMs: undefined,
    })
}

main()
