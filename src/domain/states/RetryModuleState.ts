import { DiscriminatedUnion } from "@/common/utils.js"
import { FinalState, NonFinalState, State } from "./State.js"
import { GameResult } from "../GameResult.js"

type Stats = Record<GameResult, number>

export type RetryModuleState<S extends State> = DiscriminatedUnion<{
    active: { wrapped: NonFinalState<S>; stats: Stats }
    waiting: { wrapped: FinalState<S>; stats: Stats }
    done: { wrapped: FinalState<S>; stats: Stats }
}>
