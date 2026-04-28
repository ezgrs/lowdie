import {RNG} from "../../../domain/services/rng";

export class RandomRNG implements RNG {
    choose<T>(values: T[]): T {
        return values[Math.floor(Math.random() * values.length)]!;
    }
}
