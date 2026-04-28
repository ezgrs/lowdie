export interface RNG {
    choose<T>(values: readonly T[]): T
}
