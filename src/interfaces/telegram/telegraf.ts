import { Consumer } from "@/application/ports/Consumer.js"
import { Minifier } from "@/domain/minifiers/Minifier.js"
import { MinifiedModule } from "@/domain/modules/MinifiedModule.js"
import { Module } from "@/domain/modules/Module.js"
import { isNonFinal } from "@/domain/states/helpers.js"
import { State } from "@/domain/states/State.js"
import { Event } from "@/domain/events/Event.js"
import { Context, Telegraf, Telegram } from "telegraf"
import { message } from "telegraf/filters"

type Args<S extends State, E extends Event, ME> = {
    token: string
    module: Module<S, E>
    minifier: Minifier<S, E, ME>
    onConsumer: (telegram: Telegram, chatId: number) => Consumer<S>
}

export function telegrafOf<S extends State, E extends Event, ME>(
    args: Args<S, E, ME>,
): Telegraf<Context> {
    const module = new MinifiedModule({
        minifier: args.minifier,
        module: args.module,
    })
    const telegraf = new Telegraf(args.token)
    telegraf.start(async (ctx) => {
        const consumer = args.onConsumer(telegraf.telegram, ctx.chat.id)
        await consumer.consume(module.getInitialState())
    })
    telegraf.on(message("text"), async (ctx) => {
        const consumer = args.onConsumer(telegraf.telegram, ctx.chat.id)
        const currentState = await consumer.provide()
        if (isNonFinal(currentState)) {
            const prompt = module.getPrompt(currentState)
            switch (prompt.type) {
                case "input":
                    const event = prompt.parser(ctx.message.text)
                    if (event == null) return
                    const updatedState = module.applyEvent(currentState, event)
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
            const prompt = module.getPrompt(currentState)
            switch (prompt.type) {
                case "select":
                    const event = JSON.parse(data) as ME
                    const updatedState = module.applyEvent(currentState, event)
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
