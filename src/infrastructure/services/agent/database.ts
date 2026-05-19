import { BotState } from "@/application/use-cases/modules/bot/State.js"
import { executeAction, ModuleSpec } from "@/interfaces/common/runner.js"
import { BotEvent } from "@/application/use-cases/modules/bot/Event.js"
import { isNonFinal } from "@/domain/services/State.js"
import { Event } from "@/domain/entities/Event.js"
import { Agent } from "@/application/ports/Agent.js"
import { InteractionChannel } from "@/application/ports/InteractionChannel.js"
import { Action } from "@/domain/entities/Action.js"

export interface BotStateDatabase {
    set(chatId: number, state: BotState): Promise<void>
    get(chatId: number): Promise<BotState | undefined>
}

type Args = {
    database: BotStateDatabase
    spec: ModuleSpec<BotState, BotEvent<Event>, any>
    onChannel: (chatId: number) => InteractionChannel
}

export class DatabaseBasedAgent implements Agent {
    private readonly database: BotStateDatabase
    private readonly spec: ModuleSpec<BotState, BotEvent<Event>, any>
    private readonly onChannel: (chatId: number) => InteractionChannel

    constructor(args: Args) {
        this.database = args.database
        this.spec = args.spec
        this.onChannel = args.onChannel
    }

    private async processState(chatId: number, state: BotState) {
        const channel = this.onChannel(chatId)

        await this.database.set(chatId, state)

        const messages = this.spec.renderer.onState(state)
        for (const message of messages.slice(0, -1)) {
            await channel.send(message)
        }

        if (isNonFinal(state)) {
            const action = this.spec.module.getAction(state)

            const minifier = this.spec.minifier
            let minifiedAction: Action<BotEvent<Event>>
            switch (action.type) {
                case "select":
                    minifiedAction = {
                        type: "select",
                        choices: action.choices.map((event) =>
                            minifier.encode(state, event),
                        ),
                    }
                    break
                case "input":
                    minifiedAction = {
                        type: "input",
                        parser: (input) => {
                            const event = action.parser(input)
                            if (event == null) return null
                            return minifier.encode(state, event)
                        },
                    }
                    break
            }
            await executeAction({
                channel: channel,
                action: minifiedAction,
                label: messages[messages.length - 1],
                signal: undefined,
                sessionTtlMs: undefined,
                renderEvent: (e) => this.spec.renderer.onEvent(state, e),
            })
        }
    }

    async started(chatId: number): Promise<void> {
        await this.processState(chatId, this.spec.module.getInitialState())
    }

    async texted(chatId: number, text: string): Promise<void> {
        const state = await this.database.get(chatId)
        if (state == null) {
            console.log("texted: user has no database state")
            return await this.started(chatId)
        }
        if (isNonFinal(state)) {
            const action = this.spec.module.getAction(state)
            switch (action.type) {
                case "input":
                    const event = action.parser(text)
                    if (event == null) {
                        console.log("texted: expected a valid event")
                        return await this.processState(chatId, state)
                    }
                    return await this.processState(
                        chatId,
                        this.spec.module.applyEvent(state, event),
                    )

                default:
                    console.log("texted: expected an input action")
                    return await this.started(chatId)
            }
        }
    }

    async answered(chatId: number, data: string): Promise<void> {
        const state = await this.database.get(chatId)
        if (state == null) {
            console.log("answered: user has no database state")
            return await this.started(chatId)
        }
        if (isNonFinal(state)) {
            const action = this.spec.module.getAction(state)
            switch (action.type) {
                case "select":
                    let obj: any
                    try {
                        obj = JSON.parse(data)
                    } catch (e) {
                        console.log(`answered: failed to deserialize ${data}`)
                        return await this.started(chatId)
                    }
                    const event = this.spec.minifier.decode(state, obj)
                    return await this.processState(
                        chatId,
                        this.spec.module.applyEvent(state, event),
                    )
                default:
                    console.log("answered: expected a select action")
                    return await this.started(chatId)
            }
        }
    }

    async disposed(_: string): Promise<void> {}
}
