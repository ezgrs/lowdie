import { Context, Telegraf } from "telegraf"
import { TelegramBot } from "@/src/infrastructure/services/interaction-channel/telegram/bot.js"
import { message } from "telegraf/filters"

export function telegrafOf(token: string, bot: TelegramBot): Telegraf<Context> {
    const telegraf = new Telegraf(token)
    telegraf.start(async (ctx) => {
        await bot.started(telegraf, ctx.chat.id)
    })
    telegraf.on(message("text"), async (ctx) => {
        await bot.texted(telegraf, ctx.chat.id, ctx.message.text)
    })
    telegraf.on("callback_query", async (ctx) => {
        const data =
            "data" in ctx.callbackQuery ? ctx.callbackQuery.data : undefined
        if (data == null) return
        await bot.answered(telegraf, ctx.chat!.id, data)
        await ctx.answerCbQuery()
    })
    return telegraf
}
