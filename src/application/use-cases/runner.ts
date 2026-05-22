import { NonFinalState, State } from "@/domain/states/State.js"
import { Event } from "@/domain/events/Event.js"
import { Chat, InteractionOptions } from "../ports/Chat.js"
import { SessionTimeoutError } from "@/domain/errors/SessionTimeoutError.js"
import { isFinal, isNonFinal } from "@/domain/states/helpers.js"
import { Module } from "@/domain/modules/Module.js"
import { Renderer } from "../ports/Renderer.js"
import { t } from "@/interfaces/i18n/index.js"

export type ModuleSpec<S extends State, E extends Event> = {
    module: Module<S, E>
    renderer: Renderer<S, E>
}

type ExecuteActionArgs<S extends State, E extends Event> = {
    spec: ModuleSpec<S, E>
    state: NonFinalState<S>

    prompt: string | undefined
    chat: Chat
    options: InteractionOptions | undefined
}

export async function executeAction<S extends State, E extends Event>({
    spec,
    state,
    prompt,
    chat,
    options,
}: ExecuteActionArgs<S, E>): Promise<E | null> {
    const action = spec.module.getAction(state)
    switch (action.type) {
        case "select":
            return await chat.askChoices(
                prompt ?? t("bot:input.select") + ":",
                action.choices.map((event) => ({
                    value: event,
                    label: spec.renderer.choiceLabelOf(state, event),
                })),
                options,
            )
        case "input":
            return await chat
                .askText(prompt ?? t("bot:input.select") + ":", options)
                .then(action.parser)
    }
}

type ExecuteModuleArgs<S extends State, E extends Event> = {
    spec: ModuleSpec<S, E>
    chat: Chat
    options: InteractionOptions | undefined
}

async function foo<S extends State, E extends Event>(
    chat: Chat,
    spec: ModuleSpec<S, E>,
    state: NonFinalState<S>,
    options: InteractionOptions | undefined,
): Promise<S | null> {
    const messages = spec.renderer.messagesOf(state)
    for (const message of messages.slice(0, -1)) {
        await chat.send(message)
    }
    let event: E | null
    try {
        event = await executeAction({
            spec,
            chat,
            state,
            prompt: messages[messages.length - 1],
            options,
        })
    } catch (e: any) {
        if (e instanceof SessionTimeoutError) {
            await chat.send(
                "Timed-out. Please start a new conversation with /start.",
            )
        }
        console.error(e)
        return null
    }
    if (event == null) {
        return foo(chat, spec, state, options)
    }
    return spec.module.applyEvent(state, event)
}

export async function runModuleLoop<S extends State, E extends Event>({
    spec,
    chat,
    options,
}: ExecuteModuleArgs<S, E>) {
    let state: NonFinalState<S> = spec.module.getInitialState()
    while (!(options?.signal?.aborted ?? false)) {
        const nextState = await foo(chat, spec, state, options)
        if (nextState == null) return
        if (isFinal(nextState)) break
        if (isNonFinal(nextState)) {
            state = nextState
        }
    }
}
