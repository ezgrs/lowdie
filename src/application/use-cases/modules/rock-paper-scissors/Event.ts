import { DiscriminatedUnion } from "@/common/utils.js"
import { Move } from "@/domain/entities/RockPaperScissors.js"

export type RockPaperScissorsGameEvent = DiscriminatedUnion<{
    userChose: {
        move: Move
    }
}>
