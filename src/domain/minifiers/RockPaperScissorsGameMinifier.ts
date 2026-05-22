import { RockPaperScissorsGameEvent } from "../events/RockPaperScissorsGameEvent.js"
import { RockPaperScissorsGameState } from "../states/RockPaperScissorsGameState.js"
import { Minifier } from "./Minifier.js"

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
