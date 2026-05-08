export interface Randomizer {
    choose<T>(values: readonly T[]): T
    shuffle<T>(values: readonly T[]): T[]
}
