import {
    InteractionChannel,
    InteractionOptions,
} from "@/application/ports/InteractionChannel.js"
import { RockPaperScissorsGame } from "@/application/use-cases/modules/rock-paper-scissors/Module.js"
import { NonFinalState, State } from "@/domain/entities/State.js"
import { isFinal, isNonFinal } from "@/domain/services/State.js"
import { t } from "@/interfaces/i18n/index.js"
import { RetryModule } from "@/application/use-cases/modules/retry/Module.js"
import { BotModule } from "@/application/use-cases/modules/bot/Module.js"
import { BotState } from "@/application/use-cases/modules/bot/State.js"
import { BotEvent } from "@/application/use-cases/modules/bot/Event.js"
import { TicTacToeGame } from "@/application/use-cases/modules/tic-tac-toe/Module.js"
import { Randomizer } from "@/application/ports/Randomizer.js"
import { TicTacToeBoardPresenter } from "./TicTacToeBoardPresenter.js"
import { Event } from "@/domain/entities/Event.js"
import { SessionTimeoutError } from "@/domain/entities/errors.js"
import { RetryModuleRenderer } from "./renderers/retry.js"
import { RockPaperScissorsGameRenderer } from "./renderers/rock-paper-scissors.js"
import { TicTacToeGameRenderer } from "./renderers/tic-tac-toe.js"
import { BotRenderer } from "./renderers/bot.js"
import { Module } from "@/application/ports/Module.js"
import { Renderer } from "@/application/ports/Renderer.js"

type ExecuteActionArgs<S extends State, E extends Event> = {
    spec: ModuleSpec<S, E>
    state: NonFinalState<S>

    prompt: string | undefined
    channel: InteractionChannel
    options: InteractionOptions | undefined
}

export async function executeAction<S extends State, E extends Event>({
    spec,
    state,
    prompt,
    channel,
    options,
}: ExecuteActionArgs<S, E>): Promise<E | null> {
    const action = spec.module.getAction(state)
    switch (action.type) {
        case "select":
            return await channel.askChoices(
                prompt ?? t("bot:input.select") + ":",
                action.choices.map((event) => ({
                    value: event,
                    label: spec.renderer.choiceLabelOf(state, event),
                })),
                options,
            )
        case "input":
            return await channel
                .askText(prompt ?? t("bot:input.select") + ":", options)
                .then(action.parser)
    }
}

type ExecuteModuleArgs<S extends State, E extends Event> = {
    spec: ModuleSpec<S, E>
    channel: InteractionChannel
    options: InteractionOptions | undefined
}

async function foo<S extends State, E extends Event>(
    channel: InteractionChannel,
    spec: ModuleSpec<S, E>,
    state: NonFinalState<S>,
    options: InteractionOptions | undefined,
): Promise<S | null> {
    const messages = spec.renderer.messagesOf(state)
    for (const message of messages.slice(0, -1)) {
        await channel.send(message)
    }
    let event: E | null
    try {
        event = await executeAction({
            spec,
            channel,
            state,
            prompt: messages[messages.length - 1],
            options,
        })
    } catch (e: any) {
        if (e instanceof SessionTimeoutError) {
            await channel.send(
                "Timed-out. Please start a new conversation with /start.",
            )
        }
        console.error(e)
        return null
    }
    if (event == null) {
        return foo(channel, spec, state, options)
    }
    return spec.module.applyEvent(state, event)
}

export async function runModuleLoop<S extends State, E extends Event>({
    spec,
    channel,
    options,
}: ExecuteModuleArgs<S, E>) {
    let state: NonFinalState<S> = spec.module.getInitialState()
    while (!(options?.signal?.aborted ?? false)) {
        const nextState = await foo(channel, spec, state, options)
        if (nextState == null) return
        if (isFinal(nextState)) break
        if (isNonFinal(nextState)) {
            state = nextState
        }
    }
}

export type ModuleSpec<S extends State, E extends Event> = {
    module: Module<S, E>
    renderer: Renderer<S, E>
}

export function botSpecOf(
    randomizer: Randomizer,
    ticTacToeBoardPresenter: TicTacToeBoardPresenter,
): ModuleSpec<BotState, BotEvent<Event>> {
    let specs: ModuleSpec<State, Event>[] = [
        {
            module: new RockPaperScissorsGame({ randomizer }),
            renderer: new RockPaperScissorsGameRenderer(),
        },
        {
            module: new TicTacToeGame({ randomizer }),
            renderer: new TicTacToeGameRenderer({
                boardPresenter: ticTacToeBoardPresenter,
            }),
        },
    ]
    specs = specs.map((spec) => ({
        module: new RetryModule(spec.module),
        renderer: new RetryModuleRenderer(spec.renderer),
    }))
    return {
        module: new BotModule(specs.map((spec) => spec.module)),
        renderer: new BotRenderer(specs.map((spec) => spec.renderer)),
    }
}
