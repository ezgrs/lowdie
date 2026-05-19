import { InteractionChannel } from "@/src/application/ports/InteractionChannel.js"
import { RockPaperScissorsGame } from "@/src/application/use-cases/modules/rock-paper-scissors/Module.js"
import { State } from "@/src/domain/entities/State.js"
import { isFinal, isNonFinal } from "@/src/domain/services/State.js"
import { t } from "@/src/interfaces/i18n/index.js"
import { Module } from "@/src/application/ports/Module.js"
import { RetryModule } from "@/src/application/use-cases/modules/retry/Module.js"
import { Action } from "@/src/domain/entities/Action.js"
import { RockPaperScissorsGameState } from "@/src/application/use-cases/modules/rock-paper-scissors/State.js"
import { RockPaperScissorsGameEvent } from "@/src/application/use-cases/modules/rock-paper-scissors/Event.js"
import {
    isRetryModuleEvent,
    RetryModuleEvent,
} from "@/src/application/use-cases/modules/retry/Event.js"
import { RetryModuleState } from "@/src/application/use-cases/modules/retry/State.js"
import { evaluateGame } from "@/src/domain/services/RockPaperScissors.js"
import { BotModule } from "@/src/application/use-cases/modules/bot/Module.js"
import { BotState } from "@/src/application/use-cases/modules/bot/State.js"
import {
    BotEvent,
    isBotEvent,
} from "@/src/application/use-cases/modules/bot/Event.js"
import { TicTacToeGameState } from "@/src/application/use-cases/modules/tic-tac-toe/State.js"
import { TicTacToeGameEvent } from "@/src/application/use-cases/modules/tic-tac-toe/Event.js"
import { TicTacToeGame } from "@/src/application/use-cases/modules/tic-tac-toe/Module.js"
import { Randomizer } from "@/src/application/ports/Randomizer.js"
import { TicTacToeBoardPresenter } from "./TicTacToeBoardPresenter.js"
import { Event } from "@/src/domain/entities/Event.js"
import {
    SessionTimeoutError,
    UnexpectedModuleFlow,
} from "@/src/domain/entities/errors.js"

interface Renderer<S extends State, E> {
    onEvent: (state: S, event: E) => string
    onState: (state: S) => string[]
}

export type ModuleSpec<S extends State, E> = {
    module: Module<S, E>
    renderer: Renderer<S, E>
}

type LeafModuleSpec<S extends State, E> = ModuleSpec<S, E> & { title: string }

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

type ExecuteModuleArgs<S extends State, E> = {
    spec: ModuleSpec<S, E>
    channel: InteractionChannel
    signal: AbortSignal | undefined
    sessionTtlMs: number | undefined
}

export async function runModuleLoop<S extends State, E>({
    spec,
    channel,
    signal,
    sessionTtlMs,
}: ExecuteModuleArgs<S, E>) {
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

function createBotSpec(
    specs: LeafModuleSpec<any, any>[],
): ModuleSpec<BotState, BotEvent<Event>> {
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
    }
}

function createRetrySpec<S extends State, E extends Event>(
    spec: LeafModuleSpec<S, E>,
): ModuleSpec<RetryModuleState<S>, RetryModuleEvent<E>> {
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
    }
}

export function botSpecOf(
    randomizer: Randomizer,
    ticTacToeBoardPresenter: TicTacToeBoardPresenter,
): ModuleSpec<BotState, BotEvent<Event>> {
    const rpsSpec: LeafModuleSpec<
        RockPaperScissorsGameState,
        RockPaperScissorsGameEvent
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
    }
    const tttSpec: LeafModuleSpec<TicTacToeGameState, TicTacToeGameEvent> = {
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
    }
    return createBotSpec([rpsSpec, tttSpec])
}
