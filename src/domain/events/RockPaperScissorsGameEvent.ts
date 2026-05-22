import { DiscriminatedUnion } from "@/common/utils.js"
import { RockPaperScissorsMove } from "../rock-paper-scissors/RockPaperScissorsMove.js"

export type RockPaperScissorsGameEvent = DiscriminatedUnion<{
    userChose: {
        move: RockPaperScissorsMove
    }
}>
