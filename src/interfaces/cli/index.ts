import { StreamTransmitter } from "@/infrastructure/services/transmitters/stream.js"
import { PseudoRandomizer } from "@/infrastructure/services/randomizers/pseudo.js"
import { botSpecOf } from "@/interfaces/common/specs.js"
import { TicTacToeAsciiBoardPresenter } from "@/interfaces/common/TicTacToeBoardPresenter.js"
import { MemoryConsumer } from "@/application/use-cases/consumers/MemoryConsumer.js"
import { InquirerRequester } from "@/infrastructure/services/requesters/inquirer.js"
import { isFinal } from "@/domain/states/helpers.js"
import { TransmittingConsumer } from "@/application/use-cases/consumers/TransmittingConsumer.js"
import { AsyncStream } from "@/common/AsyncStream.js"
import { BotEvent } from "@/domain/events/BotEvent.js"
import { Event } from "@/domain/events/Event.js"
import { NonBlockingRequester } from "@/application/use-cases/requesters/NonBlockingRequester.js"

async function main() {
    const spec = botSpecOf(
        new PseudoRandomizer(),
        new TicTacToeAsciiBoardPresenter(),
    )

    const stream = new AsyncStream<BotEvent<Event>>()
    const consumer = new TransmittingConsumer({
        spec: spec,
        consumer: new MemoryConsumer(spec.module.getInitialState()),
        transmitter: new StreamTransmitter({
            output: process.stdout,
            requester: new NonBlockingRequester({
                stream: stream,
                requester: new InquirerRequester({
                    input: process.stdin,
                    output: process.stdout,
                }),
            }),
        }),
    })

    await consumer.consume(spec.module.getInitialState())
    for (;;) {
        const currentState = await consumer.provide()
        if (isFinal(currentState)) {
            break
        }
        const event = await stream.next()
        if (event == null) continue
        const updatedState = spec.module.applyEvent(currentState, event)
        await consumer.consume(updatedState)
    }
}

main()
