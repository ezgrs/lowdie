import { Randomizer } from "@/src/application/ports/Randomizer.js"
import { Module } from "@/src/application/ports/Module.js"
import { moves } from "@/src/domain/entities/RockPaperScissors.js"
import { NonFinalState } from "@/src/domain/entities/State.js"
import { Action } from "@/src/domain/entities/Action.js"
import { RockPaperScissorsGameEvent } from "./Event.js"
import { RockPaperScissorsGameState } from "./State.js"

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
            botMove: this.randomizer.choose(moves),
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
                    choices: moves.map((move) => ({
                        type: "userChose",
                        move,
                    })),
                }
        }
    }
}
