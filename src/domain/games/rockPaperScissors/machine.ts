import { ActionFunction, assign, emit, sendTo, setup } from "xstate"
import { RockPaperScissorsMove } from "../../models/rockPaperScissors"
import { RNG } from "../../services/rng"
import { BotActorRef, ModuleEvent } from "../../bot/machine"
import { t } from "../../../interfaces/i18n"

type Event = { type: "ANSWER"; value: string }

type MachineInput = {
    parentRef: BotActorRef | undefined
    rng: RNG
    botMove: RockPaperScissorsMove
}

type MachineContext = MachineInput & {
    userMove: RockPaperScissorsMove | undefined
}

function emitOrSend(
    parentRef: BotActorRef | undefined,
    data: ModuleEvent,
): ActionFunction<
    MachineContext,
    any,
    ModuleEvent,
    any,
    any,
    any,
    any,
    any,
    any
> {
    if (parentRef == null) {
        return emit(data)
    }
    return sendTo(parentRef, data)
}

export default setup({
    types: {
        context: {} as MachineContext,
        events: {} as Event,
        input: {} as MachineInput,
    },
    guards: {
        didUserSelectRock: ({ event }) =>
            event.type == "ANSWER" &&
            event.value.toLowerCase() == t("rps:rock"),
        didUserSelectPaper: ({ event }) =>
            event.type == "ANSWER" &&
            event.value.toLowerCase() == t("rps:paper"),
        didUserSelectScissors: ({ event }) =>
            event.type == "ANSWER" &&
            event.value.toLowerCase() == t("rps:scissors"),
        didUserContinue: ({ event }) =>
            event.type == "ANSWER" &&
            event.value.toLowerCase() == t("common:yes"),
        didUserCancel: ({ event }) =>
            event.type == "ANSWER" &&
            event.value.toLowerCase() == t("common:no"),
    },
}).createMachine({
    context: ({ input }) => ({
        rng: input.rng,
        botMove: input.botMove,
        parentRef: input.parentRef,
        userMove: undefined,
    }),
    initial: "waitingForUser",
    entry: ({ context }) =>
        emitOrSend(context.parentRef, {
            type: "moduleNotification",
            label: "rps.welcome",
        }),
    states: {
        waitingForUser: {
            on: {
                ANSWER: [
                    {
                        guard: "didUserSelectRock",
                        target: "askForRetry",
                        actions: assign({ userMove: () => "rock" }),
                    },
                    {
                        guard: "didUserSelectPaper",
                        target: "askForRetry",
                        actions: assign({ userMove: () => "paper" }),
                    },
                    {
                        guard: "didUserSelectScissors",
                        target: "askForRetry",
                        actions: assign({ userMove: () => "scissors" }),
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
                                context.rng.choose([
                                    "rock",
                                    "paper",
                                    "scissors",
                                ]),
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
})
