import { DiscriminatedUnion } from "@/src/common/utils.js"
import { Move } from "@/src/domain/entities/RockPaperScissors.js"

export type RockPaperScissorsGameState = DiscriminatedUnion<{
    waitingForUser: {
        botMove: Move
    }
    done: {
        botMove: Move
        userMove: Move
    }
}>
