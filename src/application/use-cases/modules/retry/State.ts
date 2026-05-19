import { DiscriminatedUnion } from "@/src/common/utils.js"
import {
    FinalState,
    NonFinalState,
    State,
} from "@/src/domain/entities/State.js"

export type RetryModuleState<S extends State> = DiscriminatedUnion<{
    active: { wrapped: NonFinalState<S> }
    waiting: { wrapped: FinalState<S> }
    done: { wrapped: FinalState<S> }
}>
