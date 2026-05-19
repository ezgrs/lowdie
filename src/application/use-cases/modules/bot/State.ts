import { DiscriminatedUnion } from "@/src/common/utils.js"
import { NonFinalState } from "@/src/domain/entities/State.js"

export type BotState = DiscriminatedUnion<{
    waiting: {}
    active: { index: number; wrapped: NonFinalState<any> }
    done: {}
}>
