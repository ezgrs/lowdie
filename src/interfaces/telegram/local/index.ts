import { PseudoRandomizer } from "@/infrastructure/services/randomizers/pseudo.js"
import dotenv from "dotenv"
import { botSpecOf } from "@/interfaces/common/specs.js"
import { TicTacToeAsciiBoardPresenter } from "@/interfaces/common/TicTacToeBoardPresenter.js"
import { telegrafOf } from "@/interfaces/telegram/telegraf.js"
import { TelegramTransmitter } from "@/infrastructure/services/transmitters/telegram.js"
import { BotEvent } from "@/domain/events/BotEvent.js"
import { MemoryConsumer } from "@/application/use-cases/consumers/MemoryConsumer.js"
import { BotState } from "@/domain/states/BotState.js"
import { Event } from "@/domain/events/Event.js"
import { Consumer } from "@/application/ports/Consumer.js"
import { TransmittingConsumer } from "@/application/use-cases/consumers/TransmittingConsumer.js"

async function main() {
    dotenv.config()

    const abortController = new AbortController()

    const spec = botSpecOf(
        new PseudoRandomizer(),
        new TicTacToeAsciiBoardPresenter(),
    )
    const consumers: Map<number, Consumer<BotState>> = new Map()

    const telegraf = telegrafOf<BotState, BotEvent<Event>>({
        token: process.env["TELEGRAM_BOT_TOKEN"]!,
        module: spec.module,
        onConsumer: (telegram, chatId) => {
            let consumer = consumers.get(chatId)
            if (consumer == null) {
                consumer = new TransmittingConsumer({
                    spec: spec,
                    consumer: new MemoryConsumer(spec.module.getInitialState()),
                    transmitter: new TelegramTransmitter(telegram, chatId),
                })
                consumers.set(chatId, consumer)
            }
            return consumer
        },
    })
    for (const reason of ["SIGINT", "SIGTERM"]) {
        process.once(reason, async () => {
            abortController.abort()
            telegraf.stop(reason)
        })
    }
    await telegraf.launch()
}

main()
