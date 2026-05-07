import { PseudoRandomizer } from "../../infrastructure/services/randomizer/PseudoRandomizer.js"
import { Stream } from "../../application/ports/Stream.js"
import { RockPaperScissorsGame } from "../../application/use-cases/modules/rock-paper-scissors/Module.js"
import { input, select } from "@inquirer/prompts"
import { isFinal, isNonFinal, State } from "../../domain/entities/State.js"
import { t } from "../i18n/index.js"
import { Module } from "../../application/ports/Module.js"
import { RetryModule } from "../../application/use-cases/modules/retry/Module.js"
import { Action } from "../../domain/entities/Action.js"
import { RockPaperScissorsGameState } from "../../application/use-cases/modules/rock-paper-scissors/State.js"
import { RockPaperScissorsGameEvent } from "../../application/use-cases/modules/rock-paper-scissors/Event.js"
import { RetryModuleEvent } from "../../application/use-cases/modules/retry/Event.js"
import { RetryModuleState } from "../../application/use-cases/modules/retry/State.js"
import { evaluateGame } from "../../domain/entities/RockPaperScissors.js"
import { ConsoleStream } from "../../infrastructure/services/stream/ConsoleStream.js"
import { BotModule } from "../../application/use-cases/modules/bot/Module.js"
import { BotState } from "../../application/use-cases/modules/bot/State.js"
import { BotEvent } from "../../application/use-cases/modules/bot/Event.js"

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
    action: Action<E>,
    renderEvent: (event: E) => string,
): Promise<E> {
    switch (action.type) {
        case "select":
            const choices = action.choices.map((event) => ({
                value: event,
                name: renderEvent(event),
            }))
            return await select({
                message: t("bot:input.select"),
                choices: choices,
            })
        case "input":
            return await input({
                message: t("bot:input.text"),
            }).then(action.parser)
    }
}

async function executeModule<S extends State, E>(
    spec: ModuleSpec<S, E>,
    stream: Stream,
) {
    let state: S = spec.module.getInitialState()
    while (true) {
        const messages = spec.renderer.onState(state)
        for (const message of messages) {
            await stream.output(message)
        }

        if (isFinal(state)) {
            break
        }
        if (isNonFinal(state)) {
            const action = spec.module.getAction(state)
            let event: E
            try {
                event = await executeAction(action, (e) =>
                    spec.renderer.onEvent(state, e),
                )
            } catch (ExitPromptError) {
                return
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

async function main() {
    const randomizer = new PseudoRandomizer()
    const stream = new ConsoleStream(process.stdin)
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
    await executeModule(createBotSpec([rpsSpec]), stream)
}

main()
