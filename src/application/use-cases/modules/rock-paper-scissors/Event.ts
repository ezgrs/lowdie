import { DiscriminatedUnion } from "@/src/common/utils.js"
import { Move } from "@/src/domain/entities/RockPaperScissors.js"

export type RockPaperScissorsGameEvent = DiscriminatedUnion<{
    userChose: {
        move: Move
    }
}>
