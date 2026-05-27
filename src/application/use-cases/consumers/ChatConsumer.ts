import { Chat } from "@/application/ports/Chat.js";
import { Consumer } from "@/application/ports/Consumer.js";
import { ModuleSpec } from "@/application/ports/ModuleSpec.js";
import { RenderedPrompt } from "@/application/ports/Prompt.js";
import { isNonFinal } from "@/domain/states/helpers.js";
import { State } from "@/domain/states/State.js";
import { Event } from "@/domain/events/Event.js";

type Args<S extends State, E extends Event> = {
    spec: ModuleSpec<S, E>
    consumer: Consumer<S>
    chat: Chat<E>
}

export class ChatConsumer<S extends State, E extends Event> implements Consumer<S> {
    private readonly spec: ModuleSpec<S, E>
    private readonly consumer: Consumer<S>
    private readonly chat: Chat<E>

    constructor(args: Args<S, E>) {
        this.spec = args.spec
        this.consumer = args.consumer
        this.chat = args.chat
    }
    
    provide(): Promise<S> {
        return this.consumer.provide()
    }

    async consume(state: S): Promise<void> {
        await this.consumer.consume(state)

        const messages = this.spec.renderer.messagesOf(state)
        for (const message of messages.slice(0, -1)) {
            await this.chat.send(message)
        }

        if (isNonFinal(state)) {
            const prompt = this.spec.module.getPrompt(state)
            const renderedPrompt: RenderedPrompt<E> = (() => {
                switch (prompt.type) {
                    case "select":
                        return {
                            type: "select",
                            choices: prompt.choices,
                            labels: prompt.choices.map((event) =>
                                this.spec.renderer.choiceLabelOf(state, event),
                            ),
                        }
                    case "input":
                        return prompt
                }
            })()

            await this.chat.ask(
                renderedPrompt,
                messages[messages.length - 1]!,
            )
        }
    }
        

}