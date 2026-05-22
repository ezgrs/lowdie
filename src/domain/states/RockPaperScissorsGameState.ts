import { DiscriminatedUnion } from "@/common/utils.js"
import { RockPaperScissorsMove } from "../rock-paper-scissors/RockPaperScissorsMove.js"

export type RockPaperScissorsGameState = DiscriminatedUnion<{
    waitingForUser: {
        botMove: RockPaperScissorsMove
    }
    done: {
        botMove: RockPaperScissorsMove
        userMove: RockPaperScissorsMove
    }
}>
