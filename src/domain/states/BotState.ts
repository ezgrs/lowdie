import { DiscriminatedUnion } from "@/common/utils.js"
import { NonFinalState } from "./State.js"

export type BotState = DiscriminatedUnion<{
    waiting: {}
    active: { index: number; wrapped: NonFinalState<any> }
    done: {}
}>
