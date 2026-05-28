import { DiscriminatedUnion } from "@/common/utils.js"

export type BlackjackGameEvent = DiscriminatedUnion<{
    userHit: {}
    userStand: {}
    dealerProceeds: {}
}>
