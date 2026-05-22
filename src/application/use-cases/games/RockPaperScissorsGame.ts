import { Randomizer } from "@/application/ports/Randomizer.js"
import { Action } from "@/domain/Action.js"
import { RockPaperScissorsGameEvent } from "@/domain/events/RockPaperScissorsGameEvent.js"
import { RockPaperScissorsGameState } from "@/domain/states/RockPaperScissorsGameState.js"
import { NonFinalState } from "../../../domain/states/State.js"
import { RockPaperScissorsMove } from "../../../domain/rock-paper-scissors/RockPaperScissorsMove.js"
import { Module } from "../../../domain/modules/Module.js"

type Args = {
    randomizer: Randomizer
}

export class RockPaperScissorsGame implements Module<
    RockPaperScissorsGameState,
    RockPaperScissorsGameEvent
> {
    private readonly randomizer: Randomizer

    constructor(args: Args) {
        this.randomizer = args.randomizer
    }

    getInitialState(): NonFinalState<RockPaperScissorsGameState> {
        return {
            type: "waitingForUser",
            botMove: this.randomizer.choose([
                "rock",
                "paper",
                "scissors",
            ] as RockPaperScissorsMove[]),
        }
    }

    applyEvent(
        state: NonFinalState<RockPaperScissorsGameState>,
        event: RockPaperScissorsGameEvent,
    ): RockPaperScissorsGameState {
        switch (event.type) {
            case "userChose":
                switch (state.type) {
                    case "waitingForUser":
                        return {
                            type: "done",
                            botMove: state.botMove,
                            userMove: event.move,
                        }
                }
        }
    }

    getAction(
        state: NonFinalState<RockPaperScissorsGameState>,
    ): Action<RockPaperScissorsGameEvent> {
        switch (state.type) {
            case "waitingForUser":
                return {
                    type: "select",
                    choices: ["rock", "paper", "scissors"].map((move) => ({
                        type: "userChose",
                        move: move as RockPaperScissorsMove,
                    })),
                }
        }
    }
}
