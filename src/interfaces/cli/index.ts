import { runBot } from "../../application/runner"
import { ConsoleIO } from "../../infrastructure/services/io/console"
import { RandomRNG } from "../../infrastructure/services/rng/random"

async function main() {
    const io = new ConsoleIO(process.stdin)
    const rng = new RandomRNG()
    await runBot({ io, rng })
}

main()
