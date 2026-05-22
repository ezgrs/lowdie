import { isNonFinal } from "@/domain/states/helpers.js"
import { Event } from "@/domain/events/Event.js"
import { Inbox } from "@/application/use-cases/inboxes/Inbox.js"
import { BotEvent } from "@/domain/events/BotEvent.js"
import { BotState } from "@/domain/states/BotState.js"
import { ChatDatabase } from "@/application/ports/ChatDatabase.js"
import { executeAction, ModuleSpec } from "../runner.js"
import { Chat } from "@/application/ports/Chat.js"

type Args = {
    database: ChatDatabase<BotState>
    spec: ModuleSpec<BotState, BotEvent<Event>>
    onChat: (chatId: number) => Chat
}

export class DatabaseInbox implements Inbox {
    private readonly database: ChatDatabase<BotState>
    private readonly spec: ModuleSpec<BotState, BotEvent<Event>>
    private readonly onChat: (chatId: number) => Chat

    constructor(args: Args) {
        this.database = args.database
        this.spec = args.spec
        this.onChat = args.onChat
    }

    private async processState(chatId: number, state: BotState) {
        const chat = this.onChat(chatId)

        await this.database.set(chatId, state)

        const messages = this.spec.renderer.messagesOf(state)
        for (const message of messages.slice(0, -1)) {
            await chat.send(message)
        }

        if (isNonFinal(state)) {
            await executeAction({
                spec: this.spec,
                state,
                chat,
                prompt: messages[messages.length - 1],
                options: undefined,
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
                    let event: BotEvent<Event>
                    try {
                        event = JSON.parse(data)
                    } catch (e) {
                        console.log(`answered: failed to deserialize ${data}`)
                        return await this.started(chatId)
                    }
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
