import { BlackjackGameEvent } from "../events/BlackjackGameEvent.js"
import { BlackjackGameState } from "../states/BlackjackGameState.js"
import { Minifier } from "./Minifier.js"

type MinifiedBlackjackGameEvent = "u.h" | "u.s" | "d.p"

export class BlackjackGameMinifier implements Minifier<
    BlackjackGameState,
    BlackjackGameEvent,
    MinifiedBlackjackGameEvent
> {
    encode(
        _: BlackjackGameState,
        event: BlackjackGameEvent,
    ): MinifiedBlackjackGameEvent {
        switch (event.type) {
            case "userHit":
                return "u.h"
            case "userStand":
                return "u.s"
            case "dealerProceeds":
                return "d.p"
        }
    }

    decode(
        _: BlackjackGameState,
        value: MinifiedBlackjackGameEvent,
    ): BlackjackGameEvent {
        switch (value) {
            case "u.h":
                return { type: "userHit" }
            case "u.s":
                return { type: "userStand" }
            case "d.p":
                return { type: "dealerProceeds" }
        }
    }
}
