import { DiscriminatedUnion } from "../../../../common/utils.js"
import { Move } from "../../../../domain/entities/RockPaperScissors.js"

export type RockPaperScissorsGameState = DiscriminatedUnion<{
    waitingForUser: {
        botMove: Move
    }
    done: {
        botMove: Move
        userMove: Move
    }
}>
