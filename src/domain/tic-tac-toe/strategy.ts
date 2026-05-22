import { Randomizer } from "@/application/ports/Randomizer.js"
import { EasyTicTacToeStrategy } from "./strategies/EasyTicTacToeStrategy.js"
import { HardTicTacToeStrategy } from "./strategies/HardTicTacToeStrategy.js"
import { NormalTicTacToeStrategy } from "./strategies/NormalTicTacToeStrategy.js"
import { TicTacToeStrategy } from "./strategies/TicTacToeStrategy.js"
import { TicTacToeDifficulty } from "./TicTacToeDifficulty.js"

export function strategyFromDifficulty(
    difficulty: TicTacToeDifficulty,
    randomizer: Randomizer,
) {
    let strategy: TicTacToeStrategy = new EasyTicTacToeStrategy()
    if (difficulty === "easy") return strategy
    strategy = new NormalTicTacToeStrategy(strategy)
    if (difficulty === "normal") return strategy
    return new HardTicTacToeStrategy({
        randomizer: randomizer,
        strategy: strategy,
    })
}
