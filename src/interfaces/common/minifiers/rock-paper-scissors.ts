import { Minifier } from "@/application/use-cases/modules/minified.js"
import { RockPaperScissorsGameEvent } from "@/application/use-cases/modules/rock-paper-scissors/Event.js"
import { RockPaperScissorsGameState } from "@/application/use-cases/modules/rock-paper-scissors/State.js"

type MinifiedRockPaperScissorsGameEvent = "r" | "p" | "s"

export class RockPaperScissorsGameMinifier implements Minifier<
    RockPaperScissorsGameState,
    RockPaperScissorsGameEvent,
    MinifiedRockPaperScissorsGameEvent
> {
    encode(
        _: RockPaperScissorsGameState,
        event: RockPaperScissorsGameEvent,
    ): MinifiedRockPaperScissorsGameEvent {
        switch (event.type) {
            case "userChose":
                switch (event.move) {
                    case "rock":
                        return "r"
                    case "paper":
                        return "p"
                    case "scissors":
                        return "s"
                }
        }
    }
    decode(
        _: RockPaperScissorsGameState,
        value: MinifiedRockPaperScissorsGameEvent,
    ): RockPaperScissorsGameEvent {
        switch (value) {
            case "r":
                return { type: "userChose", move: "rock" }
            case "p":
                return { type: "userChose", move: "paper" }
            case "s":
                return { type: "userChose", move: "scissors" }
        }
    }
}
