import { InteractionChannel } from "@/application/ports/InteractionChannel.js"
import { RockPaperScissorsGame } from "@/application/use-cases/modules/rock-paper-scissors/Module.js"
import { State } from "@/domain/entities/State.js"
import { isFinal, isNonFinal } from "@/domain/services/State.js"
import { t } from "@/interfaces/i18n/index.js"
import { Module } from "@/application/ports/Module.js"
import { RetryModule } from "@/application/use-cases/modules/retry/Module.js"
import { Action } from "@/domain/entities/Action.js"
import { RockPaperScissorsGameState } from "@/application/use-cases/modules/rock-paper-scissors/State.js"
import { RockPaperScissorsGameEvent } from "@/application/use-cases/modules/rock-paper-scissors/Event.js"
import {
    isRetryModuleEvent,
    newRetryModuleEvent,
    RetryModuleEvent,
} from "@/application/use-cases/modules/retry/Event.js"
import { RetryModuleState } from "@/application/use-cases/modules/retry/State.js"
import { evaluateGame } from "@/domain/services/RockPaperScissors.js"
import { BotModule } from "@/application/use-cases/modules/bot/Module.js"
import { BotState } from "@/application/use-cases/modules/bot/State.js"
import {
    BotEvent,
    isBotEvent,
    newBotEvent,
} from "@/application/use-cases/modules/bot/Event.js"
import { TicTacToeGameState } from "@/application/use-cases/modules/tic-tac-toe/State.js"
import { TicTacToeGameEvent } from "@/application/use-cases/modules/tic-tac-toe/Event.js"
import { TicTacToeGame } from "@/application/use-cases/modules/tic-tac-toe/Module.js"
import { Randomizer } from "@/application/ports/Randomizer.js"
import { TicTacToeBoardPresenter } from "./TicTacToeBoardPresenter.js"
import { Event } from "@/domain/entities/Event.js"
import {
    SessionTimeoutError,
    UnexpectedModuleFlow,
} from "@/domain/entities/errors.js"

interface Renderer<S extends State, E> {
    onEvent: (state: S, event: E) => string
    onState: (state: S) => string[]
}

interface Minifier<S extends State, E, R> {
    encode(state: S, event: E): R
    decode(state: S, value: R): E
}

export type ModuleSpec<S extends State, E, M> = {
    module: Module<S, E>
    renderer: Renderer<S, E>
    minifier: Minifier<S, E, M>
}

type LeafModuleSpec<S extends State, E, M> = ModuleSpec<S, E, M> & {
    title: string
}

type ExecuteActionArgs<E> = {
    label: string | undefined
    channel: InteractionChannel
    action: Action<E>
    renderEvent: (event: E) => string
    signal: AbortSignal | undefined
    sessionTtlMs: number | undefined
}

export async function executeAction<E>({
    label,
    channel,
    action,
    renderEvent,
    signal,
    sessionTtlMs,
}: ExecuteActionArgs<E>): Promise<E | null> {
    switch (action.type) {
        case "select":
            return await channel.askChoices(
                label ?? t("bot:input.select") + ":",
                action.choices.map((event) => ({
                    value: event,
                    label: renderEvent(event),
                })),
                { signal, sessionTtlMs },
            )
        case "input":
            return await channel
                .askText(label ?? t("bot:input.select") + ":", {
                    signal,
                    sessionTtlMs,
                })
                .then(action.parser)
    }
}

type ExecuteModuleArgs<S extends State, E, M> = {
    spec: ModuleSpec<S, E, M>
    channel: InteractionChannel
    signal: AbortSignal | undefined
    sessionTtlMs: number | undefined
}

export async function runModuleLoop<S extends State, E, M>({
    spec,
    channel,
    signal,
    sessionTtlMs,
}: ExecuteModuleArgs<S, E, M>) {
    let state: S = spec.module.getInitialState()
    while (!(signal?.aborted ?? false)) {
        const messages = spec.renderer.onState(state)
        for (const message of messages.slice(0, -1)) {
            await channel.send(message)
        }

        if (isFinal(state)) {
            break
        }
        if (isNonFinal(state)) {
            const action = spec.module.getAction(state)
            let event: E | null
            try {
                event = await executeAction({
                    channel,
                    action,
                    label: messages[messages.length - 1],
                    signal,
                    sessionTtlMs,
                    renderEvent(e) {
                        return spec.renderer.onEvent(state, e)
                    },
                })
            } catch (e: any) {
                if (e instanceof SessionTimeoutError) {
                    await channel.send(
                        "Timed-out. Please start a new conversation with /start.",
                    )
                }
                return
            }
            if (event == null) {
                continue
            }
            state = spec.module.applyEvent(state, event)
        }
    }
}

type MinifiedBotEvent = { bot_m: number }
function createBotSpec(
    specs: LeafModuleSpec<any, any, any>[],
): ModuleSpec<BotState, BotEvent<Event>, MinifiedBotEvent> {
    const specsWithRetry = specs.map(createRetrySpec)
    return {
        module: new BotModule(specsWithRetry.map((spec) => spec.module)),
        renderer: {
            onEvent: (state, event) => {
                if (isBotEvent(event)) {
                    switch (event.type) {
                        case "userSelected":
                            return specs[event.index]!.title
                    }
                }
                switch (state.type) {
                    case "active":
                        return specsWithRetry[state.index]!.renderer.onEvent(
                            state.wrapped,
                            event,
                        )
                    case "waiting":
                    case "done":
                        throw new UnexpectedModuleFlow(event.type, state.type)
                }
            },
            onState: (state) => {
                switch (state.type) {
                    case "waiting":
                        return [t("bot:menu.welcome")]
                    case "done":
                        return []
                    case "active":
                        return specsWithRetry[state.index]!.renderer.onState(
                            state.wrapped,
                        )
                }
            },
        },
        minifier: {
            encode(
                state: BotState,
                event: BotEvent<Event>,
            ): MinifiedRetryModuleEvent | any {
                if (isBotEvent(event)) {
                    switch (event.type) {
                        case "userSelected":
                            return { bot_m: event.index }
                    }
                }
                switch (state.type) {
                    case "active":
                        return specs[state.index]!.minifier.encode(
                            state.wrapped,
                            event,
                        )
                }
                throw Error(
                    `unexpected condition: ${state.type} with ${event.type}`,
                )
            },
            decode(
                state: BotState,
                value: MinifiedRetryModuleEvent | any,
            ): BotEvent<Event> {
                if (
                    typeof value === "object" &&
                    value !== null &&
                    "bot_m" in value
                ) {
                    return newBotEvent({
                        type: "userSelected",
                        index: value.bot_m,
                    })
                }
                switch (state.type) {
                    case "active":
                        return specs[state.index]!.minifier.decode(
                            state.wrapped,
                            value,
                        )
                }
                throw Error(`unexpected condition: ${state.type} with ${value}`)
            },
        },
    }
}

type MinifiedRetryModuleEvent = "retry_p" | "retry_c"
function createRetrySpec<S extends State, E extends Event, M>(
    spec: LeafModuleSpec<S, E, M>,
): ModuleSpec<
    RetryModuleState<S>,
    RetryModuleEvent<E>,
    MinifiedRetryModuleEvent | M
> {
    return {
        module: new RetryModule(spec.module),
        renderer: {
            onEvent: (state, event) => {
                if (isRetryModuleEvent(event)) {
                    switch (event.type) {
                        case "userProceeded":
                            return t("common:yes")
                        case "userCanceled":
                            return t("common:no")
                    }
                }
                return spec.renderer.onEvent(state.wrapped, event)
            },
            onState: (state) => {
                const messages = [...spec.renderer.onState(state.wrapped)]
                switch (state.type) {
                    case "active":
                        break
                    case "done":
                        return []
                    case "waiting":
                        messages.push(t("bot:retry.prompt"))
                }
                return messages
            },
        },
        minifier: {
            encode(
                state: RetryModuleState<S>,
                event: RetryModuleEvent<E>,
            ): MinifiedRetryModuleEvent | M {
                if (isRetryModuleEvent(event)) {
                    switch (event.type) {
                        case "userProceeded":
                            return "retry_p"
                        case "userCanceled":
                            return "retry_c"
                    }
                }
                return spec.minifier.encode(state.wrapped, event)
            },
            decode(
                state: RetryModuleState<S>,
                value: MinifiedRetryModuleEvent | M,
            ): RetryModuleEvent<E> {
                switch (value) {
                    case "retry_c":
                        return newRetryModuleEvent({ type: "userCanceled" })
                    case "retry_p":
                        return newRetryModuleEvent({ type: "userProceeded" })
                }
                return spec.minifier.decode(state.wrapped, value)
            },
        },
    }
}

export function botSpecOf(
    randomizer: Randomizer,
    ticTacToeBoardPresenter: TicTacToeBoardPresenter,
): ModuleSpec<BotState, BotEvent<Event>, any> {
    type MinifiedRockPaperScissorsGameEvent = "r" | "p" | "s"
    const rpsSpec: LeafModuleSpec<
        RockPaperScissorsGameState,
        RockPaperScissorsGameEvent,
        MinifiedRockPaperScissorsGameEvent
    > = {
        title: t("rps:title"),
        module: new RockPaperScissorsGame({ randomizer }),
        renderer: {
            onEvent: (_, event) => {
                switch (event.type) {
                    case "userChose":
                        return t(`rps:${event.move}`)
                }
            },
            onState: (state) => {
                switch (state.type) {
                    case "waitingForUser":
                        return []
                    case "done":
                        const result = evaluateGame(
                            state.botMove,
                            state.userMove,
                        )
                        const botMoveLabel = t(`rps:${state.botMove}`)
                        return [
                            t(`rps:${result}Message`, {
                                botMove: botMoveLabel,
                            }),
                        ]
                }
            },
        },
        minifier: {
            encode(
                _,
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
            },
            decode(
                _,
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
            },
        },
    }

    type MinifiedTicTacToeGameEvent =
        | "s.s" // userStartedPropertySetup > playerSymbol
        | "s.d" // userStartedPropertySetup > difficulty
        | "s.." // userCanceledPropertySetup
        | "s.d.e" // userUpdatedProperty > difficulty > easy
        | "s.d.n" // userUpdatedProperty > difficulty > normal
        | "s.d.h" // userUpdatedProperty > difficulty > hard
        | "s.s.o" // userUpdatedProperty > playerSymbol > O
        | "s.s.x" // userUpdatedProperty > playerSymbol > X
        | "g.s" // userStartedGame
        | {
              type: "userMarkedSymbol"
              row: number
              col: number
          } // userMarkedSymbol

    const tttSpec: LeafModuleSpec<
        TicTacToeGameState,
        TicTacToeGameEvent,
        MinifiedTicTacToeGameEvent
    > = {
        title: t("ttt:title"),
        module: new TicTacToeGame({ randomizer }),
        renderer: {
            onEvent(_, event) {
                switch (event.type) {
                    case "userStartedPropertySetup":
                        switch (event.property) {
                            case "difficulty":
                                return "Alterar dificuldade"
                            case "playerSymbol":
                                return "Alterar minha peça"
                        }
                    case "userUpdatedProperty":
                        switch (event.property) {
                            case "difficulty":
                                return {
                                    easy: "Fácil",
                                    normal: "Normal",
                                    hard: "Difícil",
                                }[event.value]
                            case "playerSymbol":
                                return {
                                    X: "X",
                                    O: "O",
                                }[event.value]
                        }
                    case "userCanceledPropertySetup":
                        return "Cancelar"
                    case "userStartedGame":
                        return "Começar o jogo"
                    case "userMarkedSymbol":
                        return ""
                }
            },
            onState(state) {
                switch (state.type) {
                    case "settingUp":
                        return [
                            "Dificuldade atual: " +
                                {
                                    easy: "Fácil",
                                    normal: "Normal",
                                    hard: "Difícil",
                                }[state.difficulty] +
                                "\n" +
                                "Sua peça: " +
                                {
                                    X: "X",
                                    O: "O",
                                }[state.playerSymbol],
                        ]
                    case "playing":
                        return [
                            ticTacToeBoardPresenter.present(state.board.matrix),
                            "Em qual posição você deseja marcar?",
                        ]
                    case "done":
                        return [""]
                }
            },
        },
        minifier: {
            encode(_, event: TicTacToeGameEvent): MinifiedTicTacToeGameEvent {
                switch (event.type) {
                    case "userStartedPropertySetup":
                        switch (event.property) {
                            case "playerSymbol":
                                return "s.s"
                            case "difficulty":
                                return "s.d"
                        }
                    case "userCanceledPropertySetup":
                        return "s.."
                    case "userUpdatedProperty":
                        switch (event.property) {
                            case "difficulty":
                                switch (event.value) {
                                    case "easy":
                                        return "s.d.e"
                                    case "normal":
                                        return "s.d.n"
                                    case "hard":
                                        return "s.d.h"
                                }
                            case "playerSymbol":
                                switch (event.value) {
                                    case "O":
                                        return "s.s.o"
                                    case "X":
                                        return "s.s.x"
                                }
                        }
                    case "userStartedGame":
                        return "g.s"
                    case "userMarkedSymbol":
                        return event
                }
            },
            decode(_, value: MinifiedTicTacToeGameEvent): TicTacToeGameEvent {
                switch (value) {
                    case "s.s":
                        return {
                            type: "userStartedPropertySetup",
                            property: "playerSymbol",
                        }
                    case "s.d":
                        return {
                            type: "userStartedPropertySetup",
                            property: "difficulty",
                        }
                    case "s..":
                        return { type: "userCanceledPropertySetup" }
                    case "s.d.e":
                        return {
                            type: "userUpdatedProperty",
                            property: "difficulty",
                            value: "easy",
                        }
                    case "s.d.n":
                        return {
                            type: "userUpdatedProperty",
                            property: "difficulty",
                            value: "normal",
                        }
                    case "s.d.h":
                        return {
                            type: "userUpdatedProperty",
                            property: "difficulty",
                            value: "hard",
                        }
                    case "s.s.o":
                        return {
                            type: "userUpdatedProperty",
                            property: "playerSymbol",
                            value: "O",
                        }
                    case "s.s.x":
                        return {
                            type: "userUpdatedProperty",
                            property: "playerSymbol",
                            value: "X",
                        }
                    case "g.s":
                        return { type: "userStartedGame" }
                }
                return value
            },
        },
    }
    return createBotSpec([rpsSpec, tttSpec])
}
