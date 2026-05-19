import { Agent } from "@/src/application/ports/Agent.js"
import { Context, Telegraf, Telegram } from "telegraf"
import { message } from "telegraf/filters"

type Args = {
    token: string
    createAgent: (telegram: Telegram) => Agent
}

export function telegrafOf(args: Args): [Telegraf<Context>, Agent] {
    const telegraf = new Telegraf(args.token)
    const agent = args.createAgent(telegraf.telegram)
    telegraf.start(async (ctx) => {
        await agent.started(ctx.chat.id)
    })
    telegraf.on(message("text"), async (ctx) => {
        await agent.texted(ctx.chat.id, ctx.message.text)
    })
    telegraf.on("callback_query", async (ctx) => {
        const data =
            "data" in ctx.callbackQuery ? ctx.callbackQuery.data : undefined
        if (data == null) return
        await agent.answered(ctx.chat!.id, data)
        await ctx.answerCbQuery()
    })
    return [telegraf, agent]
}
