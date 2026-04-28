import { createActor } from "xstate";
import { IO } from "../domain/services/io";
import { RNG } from "../domain/services/rng";
import botMachine from "../domain/bot/machine";

type BotRunnerArgs = {
  io: IO;
  rng: RNG;
};

export type BotInstance = {
    dispose(): Promise<void>
}

export function runBot({ io, rng }: BotRunnerArgs): Promise<void> {
    return new Promise((resolve) => {
        const actor = createActor(botMachine, {
            input: {rng},
        })
        const notificationSubscription = actor.on('*', async (event) => {
            console.log(event)
            switch (event.label) {
                case "menu.welcome":
                    io.output("Hello!")
                    break
                case "bot.stop":
                    notificationSubscription.unsubscribe()
                    actor.stop()
                    resolve()
                    return
            }
            const message = await io.input()
            console.log(message)
            actor.send({type: "ANSWER", value: message})
        })
        actor.start()
    });
}