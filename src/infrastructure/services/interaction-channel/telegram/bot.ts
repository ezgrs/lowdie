import { Context, Telegraf } from "telegraf"

export interface TelegramBot {
    started(telegraf: Telegraf<Context>, chatId: number): Promise<void>
    texted(
        telegraf: Telegraf<Context>,
        chatId: number,
        text: string,
    ): Promise<void>
    answered(
        telegraf: Telegraf<Context>,
        chatId: number,
        data: string,
    ): Promise<void>
    disposed(reason: string): Promise<void>
}
