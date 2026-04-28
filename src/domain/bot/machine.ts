import { createMachine, emit } from "xstate";
import rockPaperScissorsMachine from "../games/rockPaperScissors/machine";
import { RNG } from "../services/rng";
import { rockPaperScissorsMoves } from "../models/rockPaperScissors";

type MachineInput = { 
    rng: RNG,
    onInvalid?: (() => void) | undefined,
}

type MachineContext = MachineInput & {}

type MachineEvent = { type: 'ANSWER'; value: string }

export default createMachine({
    types: {} as {
        context: MachineContext;
        events: MachineEvent;
        input: MachineInput;
        emitted: {type: "notification"; label: string }
        guards: {type: "didUserChoseRockPaperScissors"},
    },
    id: "bot",
    context: ({input}) => input,
    initial: "menu",
    entry: emit({
        type: "notification",
        label: "menu.welcome",
    }),
    states: {
        menu: {
            on: {
                ANSWER: [
                    {
                        guard: "didUserChoseRockPaperScissors",
                        target: "rockPaperScissors",
                    },
                    {
                        target: "menu",
                        actions: "onInvalid",
                    },
                ],
            },
        },
        rockPaperScissors: {
            invoke: {
                id: "rockPaperScissorsMachine",
                src: rockPaperScissorsMachine,
                input: ({context}) => ({
                    botMove: context.rng.choose(rockPaperScissorsMoves),
                    rng: context.rng,
                }),
                onDone: {
                    target: "menu"
                },
            },
            on: {
                ANSWER: {
                    actions: ({ event, self }) => {
                        self.getSnapshot().children["rockPaperScissorsMachine"]?.send(event)
                    },
                },
            },
        },   
    },

}, {
    guards: {
        didUserChoseRockPaperScissors: ({event}) => event.type == "ANSWER" && event.value == "Rock-paper-scissors",
    },
    actions: {
        onInvalid: ({ context }) => context.onInvalid?.(),
    },
})

