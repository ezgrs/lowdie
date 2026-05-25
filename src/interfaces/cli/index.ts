import { runModuleLoop } from "@/application/use-cases/runner.js"
import { ConsoleChat } from "@/infrastructure/services/chats/console.js"
import { PseudoRandomizer } from "@/infrastructure/services/randomizers/pseudo.js"
import { botSpecOf } from "@/interfaces/common/specs.js"
import { TicTacToeAsciiBoardPresenter } from "@/interfaces/common/TicTacToeBoardPresenter.js"

async function main() {
    await runModuleLoop({
        spec: botSpecOf(
            new PseudoRandomizer(),
            new TicTacToeAsciiBoardPresenter(),
        ),
        chat: new ConsoleChat({
            input: process.stdin,
            output: process.stdout,
            signal: undefined,
        }),
    })
}

main()
