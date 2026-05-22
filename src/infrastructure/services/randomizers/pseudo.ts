import { Randomizer } from "@/application/ports/Randomizer.js"

export class PseudoRandomizer implements Randomizer {
    choose<T>(values: readonly T[]): T {
        return values[Math.floor(Math.random() * values.length)]!
    }

    shuffle<T>(values: readonly T[]): T[] {
        const arr = [...values]
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
        }
        return arr
    }
}
