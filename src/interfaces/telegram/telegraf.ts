import { Inbox } from "@/application/use-cases/inboxes/Inbox.js"
import { Context, Telegraf, Telegram } from "telegraf"
import { message } from "telegraf/filters"

type Args = {
    token: string
    createInbox: (telegram: Telegram) => Inbox
}

export function telegrafOf(args: Args): [Telegraf<Context>, Inbox] {
    const telegraf = new Telegraf(args.token)
    const inbox = args.createInbox(telegraf.telegram)
    telegraf.start(async (ctx) => {
        await inbox.started(ctx.chat.id)
    })
    telegraf.on(message("text"), async (ctx) => {
        await inbox.texted(ctx.chat.id, ctx.message.text)
    })
    telegraf.on("callback_query", async (ctx) => {
        const data =
            "data" in ctx.callbackQuery ? ctx.callbackQuery.data : undefined
        if (data == null) return
        await inbox.answered(ctx.chat!.id, data)
        await ctx.answerCbQuery()
    })
    return [telegraf, inbox]
}
