import { ActorRef, emit, setup, Snapshot } from "xstate"
import rockPaperScissorsMachine from "../games/rockPaperScissors/machine"
import { RNG } from "../services/rng"
import { rockPaperScissorsMoves } from "../models/rockPaperScissors"

type MachineInput = { rng: RNG }

export type ModuleEvent = {
    type: "moduleNotification"
    label: string
}
export type BotActorRef = ActorRef<Snapshot<any>, ModuleEvent>

type MachineContext = MachineInput & {}

type MachineEvent = ModuleEvent | { type: "ANSWER"; value: string }

export default setup({
    types: {} as {
        context: MachineContext
        events: MachineEvent
        input: MachineInput
        emitted: { type: "notification"; label: string }
        guards: { type: "didUserChoseRockPaperScissors" }
    },
    guards: {
        didUserChoseRockPaperScissors: ({ event }) => {
            return (
                event.type == "ANSWER" && event.value == "Rock-paper-scissors"
            )
        },
    },
    actors: { rockPaperScissorsMachine },
}).createMachine({
    context: ({ input }) => input,
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
                        actions: emit({
                            type: "notification",
                            label: "menu.invalid",
                        }),
                    },
                ],
            },
        },
        rockPaperScissors: {
            invoke: {
                id: "rockPaperScissorsModule",
                src: "rockPaperScissorsMachine",
                input: ({ context, self }) => ({
                    botMove: context.rng.choose(rockPaperScissorsMoves),
                    rng: context.rng,
                    parentRef: self,
                    userMove: undefined,
                }),
                onDone: {
                    target: "menu",
                },
            },
            on: {
                ANSWER: {
                    actions: ({ event, self }) => {
                        self.getSnapshot().children[
                            "rockPaperScissorsModule"
                        ]?.send(event)
                    },
                },
                moduleNotification: {
                    actions: ({ event }) =>
                        emit({
                            type: "notification",
                            label: event.label,
                        }),
                },
            },
        },
    },
})
