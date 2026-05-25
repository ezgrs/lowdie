import { Inbox } from "@/application/use-cases/inboxes/Inbox.js"
import { PendingChat } from "../chats/PendingChat.js"
import { Chat } from "@/application/ports/Chat.js"
import { State } from "@/domain/states/State.js"
import { Module } from "@/domain/modules/Module.js"
import { Completer } from "@/common/Completer.js"
import { isNonFinal } from "@/domain/states/helpers.js"

type Args<S extends State, E> = {
    module: Module<S, E>
    onChat: (chatId: number) => Chat<E>
}

export class MemoryInbox<S extends State, E> implements Inbox<E> {
    private readonly module: Module<S, E>
    private readonly onChat: (chatId: number) => Chat<E>
    private readonly states: Map<number, [Completer<E | null>, S]> = new Map()

    constructor(args: Args<S, E>) {
        this.module = args.module
        this.onChat = args.onChat
    }

    async started(chatId: number): Promise<void> {
        const chat = this.onChat(chatId)
        this.states.set(chatId, [
            new PendingChat(chat),
            this.module.getInitialState(),
        ])
    }

    async texted(chatId: number, text: string): Promise<void> {
        const obj = this.states.get(chatId)
        if (obj == null) return
        const [chat, state] = obj
        if (isNonFinal(state)) {
            const prompt = this.module.getPrompt(state)
            let event: E | null
            switch (prompt.type) {
                case "input":
                    event = prompt.parser(text)
                    break
                case "select":
                    return
            }
            chat.resolve(event)
            if (event != null) {
                this.states.set(chatId, [
                    chat,
                    this.module.applyEvent(state, event),
                ])
            }
        }
    }

    async answered(chatId: number, event: E): Promise<void> {
        const obj = this.states.get(chatId)
        if (obj == null) return
        const [chat, state] = obj
        if (isNonFinal(state)) {
            const prompt = this.module.getPrompt(state)
            switch (prompt.type) {
                case "input":
                    break
                case "select":
                    return
            }
            chat.resolve(event)
            this.states.set(chatId, [
                chat,
                this.module.applyEvent(state, event),
            ])
        }
    }

    async disposed(): Promise<void> {}
}
