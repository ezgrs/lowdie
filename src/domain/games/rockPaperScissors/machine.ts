import { assign, createMachine } from "xstate";
import { RockPaperScissorsMove } from "../../models/rockPaperScissors";
import { RNG } from "../../services/rng";


type Event = { type: 'ANSWER'; value: string };

type MachineInput = { 
    rng: RNG,
    botMove: RockPaperScissorsMove,
}

type MachineContext = MachineInput & {
    userMove: RockPaperScissorsMove | undefined,
}

export default createMachine({
    types: {} as {
        context: MachineContext;
        events: Event;
        input: MachineInput,
        guards: |
            {type: "didUserSelectRock"} |
            {type: "didUserSelectPaper"} |
            {type: "didUserSelectScissors"} |
            {type: "didUserContinue"} |
            {type: "didUserCancel"},
    },
    id: "ticTacToe",
    context: ({input}) => ({
        rng: input.rng,
        botMove: input.botMove,
        userMove: undefined,
    }),
    initial: "waitingForUser",
    states: {
        waitingForUser: {
            on: {
                ANSWER: [
                    {
                        guard: "didUserSelectRock",
                        target: "askForRetry",
                        actions: assign({userMove: () => "rock"}),
                    },
                    {
                        guard: "didUserSelectPaper",
                        target: "askForRetry",
                        actions: assign({userMove: () => "paper"}),
                    },
                    {
                        guard: "didUserSelectScissors",
                        target: "askForRetry",
                        actions: assign({userMove: () => "scissors"}),
                    },
                    {
                        actions: () => {},
                    },
                ],
            },
        },
        askForRetry: {
            on: {
                ANSWER: [
                    {
                        guard: "didUserContinue",
                        target: "waitingForUser",
                        actions: assign({
                            userMove: () => undefined,
                            botMove: ({ context }) =>
                                context.rng.choose(["rock", "paper", "scissors"]),
                        }),
                    },
                    {
                        guard: "didUserCancel",
                        target: "done",
                    },
                ],
            },
        },
        done: {
            type: "final",
        },
    },
}, {
    guards: {
        didUserSelectRock: ({event}) => event.type == "ANSWER" && event.value.toLowerCase() == "rock",
        didUserSelectPaper: ({event}) => event.type == "ANSWER" && event.value.toLowerCase() == "paper",
        didUserSelectScissors: ({event}) => event.type == "ANSWER" && event.value.toLowerCase() == "scissors",
        didUserContinue: ({event}) => event.type == "ANSWER" && event.value.toLowerCase() == "yes",
        didUserCancel: ({event}) => event.type == "ANSWER" && event.value.toLowerCase() == "no",
    },
})
