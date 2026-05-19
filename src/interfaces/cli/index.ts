import { ConsoleInteractionChannel } from "@/src/infrastructure/services/interaction-channel/console.js"
import { PseudoRandomizer } from "@/src/infrastructure/services/randomizer/pseudo.js"
import { botSpecOf, runModuleLoop } from "@/src/interfaces/common/runner.js"
import { TicTacToeAsciiBoardPresenter } from "@/src/interfaces/common/TicTacToeBoardPresenter.js"

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
