import { Randomizer } from "../../../application/ports/Randomizer.js"

export class PseudoRandomizer implements Randomizer {
    choose<T>(values: T[]): T {
        return values[Math.floor(Math.random() * values.length)]!
    }
}
