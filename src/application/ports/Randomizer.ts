export interface Randomizer {
    choose<T>(values: readonly T[]): T
}
