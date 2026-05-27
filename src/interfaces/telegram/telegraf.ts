import { Inbox } from "@/application/ports/Inbox.js"
import { Context, Telegraf, Telegram } from "telegraf"
import { message } from "telegraf/filters"

type Args<E> = {
    token: string
    create: (telegram: Telegram, chatId: number) => Inbox<E>
}

export function telegrafOf(
    args: Args<string>,
): Telegraf<Context> {
    const telegraf = new Telegraf(args.token)
    const inboxes: Map<number, Inbox<string>> = new Map()
    telegraf.start(async (ctx) => {
        const inbox = args.create(telegraf.telegram, ctx.chat.id)
        await inbox.started()
    })
    telegraf.on(message("text"), async (ctx) => {
        const inbox = inboxes.get(ctx.chat.id)
        if (inbox == null) return
        await inbox.texted(ctx.message.text)
    })
    telegraf.on("callback_query", async (ctx) => {
        const inbox = inboxes.get(ctx.chat!.id)
        if (inbox == null) return

        const data =
            "data" in ctx.callbackQuery ? ctx.callbackQuery.data : undefined
        if (data == null) return

        await inbox.answered(data)
        await ctx.answerCbQuery()
    })
    return telegraf
}
