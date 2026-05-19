import { DiscriminatedUnion } from "@/common/utils.js"
import { FinalState, NonFinalState, State } from "@/domain/entities/State.js"

export type RetryModuleState<S extends State> = DiscriminatedUnion<{
    active: { wrapped: NonFinalState<S> }
    waiting: { wrapped: FinalState<S> }
    done: { wrapped: FinalState<S> }
}>
