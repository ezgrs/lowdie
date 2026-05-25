import { Chat, PromptOutput } from "@/application/ports/Chat.js"
import { RenderedPrompt } from "@/application/ports/Prompt.js"
import { Markup, Telegram } from "telegraf"

export class TelegramChat<E> implements Chat<E> {
    constructor(
        private readonly telegram: Telegram,
        private readonly chatId: number,
    ) {}

    async send(message: string): Promise<void> {
        if (message.length == 0) return
        await this.telegram.sendMessage(this.chatId, message)
    }

    async ask(
        prompt: RenderedPrompt<E>,
        message: string,
    ): Promise<PromptOutput<E>> {
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
        return { type: "done" }
    }
}
