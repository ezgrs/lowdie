import { isNonFinal } from "@/domain/states/helpers.js"
import { Inbox } from "@/application/use-cases/inboxes/Inbox.js"
import { ChatDatabase } from "@/application/ports/ChatDatabase.js"
import { Module } from "@/domain/modules/Module.js"
import { State } from "@/domain/states/State.js"

type Args<S extends State, E> = {
    database: ChatDatabase<S>
    module: Module<S, E>
}

export class DatabaseInbox<S extends State, E> implements Inbox<string> {
    private readonly database: ChatDatabase<S>
    private readonly module: Module<S, E>

    constructor(args: Args<S, E>) {
        this.database = args.database
        this.module = args.module
    }

    private async processState(chatId: number, state: S) {
        await this.database.set(chatId, state)
    }

    async started(chatId: number): Promise<void> {
        await this.processState(chatId, this.module.getInitialState())
    }

    async texted(chatId: number, text: string): Promise<void> {
        const state = await this.database.get(chatId)
        if (state == null) {
            console.log("texted: user has no database state")
            return await this.started(chatId)
        }
        if (isNonFinal(state)) {
            const action = this.module.getPrompt(state)
            switch (action.type) {
                case "input":
                    const event = action.parser(text)
                    if (event == null) {
                        console.log("texted: expected a valid event")
                        return await this.processState(chatId, state)
                    }
                    return await this.processState(
                        chatId,
                        this.module.applyEvent(state, event),
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
            const prompt = this.module.getPrompt(state)
            switch (prompt.type) {
                case "select":
                    let event: E
                    try {
                        event = JSON.parse(data)
                    } catch (e) {
                        console.log(`answered: failed to deserialize ${data}`)
                        return await this.started(chatId)
                    }
                    return await this.processState(
                        chatId,
                        this.module.applyEvent(state, event),
                    )
                default:
                    console.log("answered: expected a select action")
                    return await this.started(chatId)
            }
        }
    }

    async disposed(): Promise<void> {}
}
