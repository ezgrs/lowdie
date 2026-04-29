import { createActor } from "xstate"
import { IO } from "../domain/services/io"
import { RNG } from "../domain/services/rng"
import botMachine from "../domain/bot/machine"
import { t } from "../interfaces/i18n"

type BotRunnerArgs = {
    io: IO
    rng: RNG
}

export type BotInstance = {
    dispose(): Promise<void>
}

export function runBot({ io, rng }: BotRunnerArgs): Promise<void> {
    return new Promise((resolve) => {
        const actor = createActor(botMachine, {
            input: { rng },
        })
        const notificationSubscription = actor.on("*", async (event) => {
            if (event.type == "stop") {
                notificationSubscription.unsubscribe()
                actor.stop()
                resolve()
                return
            }
            io.output(t(event.label))
            const message = await io.input()
            actor.send({ type: "ANSWER", value: message })
        })
        actor.start()
    })
}
