import { PseudoRandomizer } from "../../infrastructure/services/randomizer/pseudo.js"
import { InteractionChannel } from "../../application/ports/InteractionChannel.js"
import { RockPaperScissorsGame } from "../../application/use-cases/modules/rock-paper-scissors/Module.js"
import { State } from "../../domain/entities/State.js"
import { isFinal, isNonFinal } from "../../domain/services/State.js"
import { t } from "../i18n/index.js"
import { Module } from "../../application/ports/Module.js"
import { RetryModule } from "../../application/use-cases/modules/retry/Module.js"
import { Action } from "../../domain/entities/Action.js"
import { RockPaperScissorsGameState } from "../../application/use-cases/modules/rock-paper-scissors/State.js"
import { RockPaperScissorsGameEvent } from "../../application/use-cases/modules/rock-paper-scissors/Event.js"
import { RetryModuleEvent } from "../../application/use-cases/modules/retry/Event.js"
import { RetryModuleState } from "../../application/use-cases/modules/retry/State.js"
import { evaluateGame } from "../../domain/services/RockPaperScissors.js"
import { ConsoleInteractionChannel } from "../../infrastructure/services/interaction-channel/console.js"
import { BotModule } from "../../application/use-cases/modules/bot/Module.js"
import { BotState } from "../../application/use-cases/modules/bot/State.js"
import { BotEvent } from "../../application/use-cases/modules/bot/Event.js"
import { TicTacToeGameState } from "../../application/use-cases/modules/tic-tac-toe/State.js"
import { TicTacToeGameEvent } from "../../application/use-cases/modules/tic-tac-toe/Event.js"
import { TicTacToeGame } from "../../application/use-cases/modules/tic-tac-toe/Module.js"
import { TicTacToeMatrix } from "../../domain/entities/TicTacToe.js"

interface Renderer<S extends State, E> {
    onEvent: (state: S, event: E) => string
    onState: (state: S) => string[]
}

type ModuleSpec<S extends State, E> = {
    module: Module<S, E>
    renderer: Renderer<S, E>
}

type LeafModuleSpec<S extends State, E> = ModuleSpec<S, E> & { title: string }

async function executeAction<E>(
    channel: InteractionChannel,
    action: Action<E>,
    renderEvent: (event: E) => string,
): Promise<E | null> {
    switch (action.type) {
        case "select":
            return await channel.askChoices(
                t("bot:input.select"),
                action.choices.map((event) => ({
                    value: event,
                    label: renderEvent(event),
                })),
            )
        case "input":
            return await channel
                .askText(t("bot:input.text"))
                .then(action.parser)
    }
}

async function executeModule<S extends State, E>(
    spec: ModuleSpec<S, E>,
    channel: InteractionChannel,
) {
    let state: S = spec.module.getInitialState()
    while (true) {
        const messages = spec.renderer.onState(state)
        for (const message of messages) {
            await channel.send(message)
        }

        if (isFinal(state)) {
            break
        }
        if (isNonFinal(state)) {
            const action = spec.module.getAction(state)
            let event: E | null
            try {
                event = await executeAction(channel, action, (e) =>
                    spec.renderer.onEvent(state, e),
                )
            } catch (ExitPromptError) {
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
): ModuleSpec<BotState, BotEvent> {
    const specsWithRetry = specs.map(createRetrySpec)
    return {
        module: new BotModule(specsWithRetry.map((spec) => spec.module)),
        renderer: {
            onEvent: (state, event) => {
                switch (event.type) {
                    case "userSelected":
                        return specs[event.index]!.title
                    case "subEventEmitted":
                        switch (state.type) {
                            case "active":
                                return specsWithRetry[
                                    state.index
                                ]!.renderer.onEvent(
                                    state.wrapped,
                                    event.wrapped,
                                )
                            case "waiting":
                            case "done":
                                throw new Error()
                        }
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

function createRetrySpec<S extends State, E>(
    spec: LeafModuleSpec<S, E>,
): ModuleSpec<RetryModuleState<S>, RetryModuleEvent<E>> {
    return {
        module: new RetryModule(spec.module),
        renderer: {
            onEvent: (state, event) => {
                switch (event.type) {
                    case "subEventEmitted":
                        return spec.renderer.onEvent(
                            state.wrapped,
                            event.wrapped,
                        )
                    case "userProceeded":
                        return t("common:yes")
                    case "userCanceled":
                        return t("common:no")
                }
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

export interface TicTacToeBoardPresenter {
    present(matrix: TicTacToeMatrix): string
}

export class TicTacToePrettyBoardPresenter implements TicTacToeBoardPresenter {
    present(matrix: TicTacToeMatrix): string {
        const xLabels = ["1", "2", "3"]
        const yLabels = ["A", "B", "C"]

        const text = []
        for (let i = 0; i < 3; i++) {
            if (i === 0) {
                text.push("╔══━╋━━━╋━━━╋━━━╋━")
            } else {
                text.push("╠══━╋━━━╋━━━╋━━━╋━")
            }

            let line = "║ "
            line += `${yLabels[i]} ┃ `
            for (let j = 0; j < 3; j++) {
                const value = matrix[i]![j] === null ? " " : matrix[i]![j]
                line += `${value} ┃ `
            }
            text.push(line)
        }
        text.push("╚══━╋━━━╋━━━╋━━━╋━")

        let line = "    ║ "
        for (let i = 0; i < 3; i++) {
            line += `${xLabels[i]} ║ `
        }
        text.push(line)

        text.push("    ╚═══╩═══╩═══╝")
        return text.join("\n")
    }
}

export class TicTacToeAsciiBoardPresenter implements TicTacToeBoardPresenter {
    present(matrix: TicTacToeMatrix): string {
        const xLabels = ["1", "2", "3"]
        const yLabels = ["A", "B", "C"]

        const text = []
        for (let i = 0; i < 3; i++) {
            if (i > 0) {
                text.push("+---+---+---+---")
            }

            let line = "| "
            line += `${yLabels[i]} | `
            for (let j = 0; j < 3; j++) {
                const value = matrix[i]![j] === null ? " " : matrix[i]![j]
                if (j < 2) {
                    line += `${value} | `
                } else {
                    line += `${value}`
                }
            }
            text.push(line)
        }
        text.push("+---+---+---+---+")

        let line = "    | "
        for (let i = 0; i < 3; i++) {
            line += `${xLabels[i]} | `
        }
        text.push(line)

        text.push("    +---+---+---+")
        return text.join("\n")
    }
}

async function main() {
    const randomizer = new PseudoRandomizer()
    const channel = new ConsoleInteractionChannel(process.stdin, process.stdout)
    const boardPresenter = new TicTacToeAsciiBoardPresenter()
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
                            boardPresenter.present(state.board.matrix),
                            "Em qual posição você deseja marcar?",
                        ]
                    case "done":
                        return [""]
                }
            },
        },
    }
    await executeModule(createBotSpec([rpsSpec, tttSpec]), channel)
}

main()
