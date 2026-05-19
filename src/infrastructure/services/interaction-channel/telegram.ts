import {
    InteractionChannel,
    InteractionChoice,
    InteractionOptions,
} from "@/src/application/ports/InteractionChannel.js"
import SuperJSON from "superjson"
import { Markup, Telegram } from "telegraf"

export class TelegramInteractionChannel implements InteractionChannel {
    constructor(
        private readonly telegram: Telegram,
        private readonly chatId: number,
    ) {}

    async send(message: string): Promise<void> {
        if (message.length == 0) return
        await this.telegram.sendMessage(this.chatId, message)
    }

    async askText(message: string, _?: InteractionOptions): Promise<string> {
        await this.send(message)
        return null as unknown as string
    }

    async askChoices<T>(
        message: string,
        choices: InteractionChoice<T>[],
        _?: InteractionOptions,
    ): Promise<T> {
        const buttons = choices.map((choice) => {
            const result = SuperJSON.serialize(choice.value)
            const data = JSON.stringify(result)
            console.log(`sending BUTTON_DATA: ${data}`)
            return [Markup.button.callback(choice.label, data)]
        })
        await this.telegram.sendMessage(
            this.chatId,
            message,
            Markup.inlineKeyboard(buttons),
        )
        return null as unknown as T
    }
}
