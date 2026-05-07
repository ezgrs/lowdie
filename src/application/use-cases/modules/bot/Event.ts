import { DiscriminatedUnion } from "../../../../common/utils.js"

export type BotEvent = DiscriminatedUnion<{
    userSelected: { index: number }
    subEventEmitted: { wrapped: any }
}>
