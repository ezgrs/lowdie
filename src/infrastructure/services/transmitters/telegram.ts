import { Transmitter } from "@/application/ports/Transmitter.js"
import { RenderedPrompt } from "@/application/ports/Prompt.js"
import { Markup, Telegram } from "telegraf"

export class TelegramTransmitter<E> implements Transmitter<E> {
    constructor(
        private readonly telegram: Telegram,
        private readonly chatId: number,
    ) {}

    async send(message: string): Promise<void> {
        if (message.length == 0) return
        await this.telegram.sendMessage(this.chatId, message)
    }

    async ask(prompt: RenderedPrompt<E>, message: string): Promise<void> {
        switch (prompt.type) {
            case "input":
                await this.send(message)
                break
            case "select":
                const buttons = prompt.choices.map((choice, index) => {
                    return [
                        Markup.button.callback(
                            prompt.labels[index]!,
                            JSON.stringify(choice),
                        ),
                    ]
                })
                await this.telegram.sendMessage(
                    this.chatId,
                    message,
                    Markup.inlineKeyboard(buttons),
                )
        }
    }
}
