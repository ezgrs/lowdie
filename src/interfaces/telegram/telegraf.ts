import { Consumer } from "@/application/ports/Consumer.js"
import { Module } from "@/domain/modules/Module.js"
import { isNonFinal } from "@/domain/states/helpers.js"
import { State } from "@/domain/states/State.js"
import { Context, Telegraf, Telegram } from "telegraf"
import { message } from "telegraf/filters"

type Args<S extends State, E> = {
    token: string
    module: Module<S, E>
    onConsumer: (telegram: Telegram, chatId: number) => Consumer<S>
}

export function telegrafOf<S extends State, E>(
    args: Args<S, E>,
): Telegraf<Context> {
    const telegraf = new Telegraf(args.token)
    telegraf.start(async (ctx) => {
        const consumer = args.onConsumer(telegraf.telegram, ctx.chat.id)
        await consumer.consume(args.module.getInitialState())
    })
    telegraf.on(message("text"), async (ctx) => {
        const consumer = args.onConsumer(telegraf.telegram, ctx.chat.id)
        const currentState = await consumer.provide()
        if (isNonFinal(currentState)) {
            const prompt = args.module.getPrompt(currentState)
            switch (prompt.type) {
                case "input":
                    const event = prompt.parser(ctx.message.text)
                    if (event == null) return
                    const updatedState = args.module.applyEvent(
                        currentState,
                        event,
                    )
                    await consumer.consume(updatedState)
                    break
                case "select":
                    return
            }
        }
    })
    telegraf.on("callback_query", async (ctx) => {
        const data =
            "data" in ctx.callbackQuery ? ctx.callbackQuery.data : undefined
        if (data == null) return

        const consumer = args.onConsumer(telegraf.telegram, ctx.chat!.id)
        const currentState = await consumer.provide()
        if (isNonFinal(currentState)) {
            const prompt = args.module.getPrompt(currentState)
            switch (prompt.type) {
                case "select":
                    const event = JSON.parse(data) as E
                    const updatedState = args.module.applyEvent(
                        currentState,
                        event,
                    )
                    await consumer.consume(updatedState)
                    break
                case "input":
                    return
            }
            await ctx.answerCbQuery()
        }
    })
    return telegraf
}
