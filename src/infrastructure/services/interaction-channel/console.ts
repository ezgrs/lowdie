import { input, select } from "@inquirer/prompts"
import {
    InteractionChannel,
    InteractionChoice,
    InteractionOptions,
} from "../../../application/ports/InteractionChannel.js"

export class ConsoleInteractionChannel implements InteractionChannel {
    async send(message: string): Promise<void> {
        console.log(message)
    }

    async askText(message: string, _?: InteractionOptions): Promise<string> {
        return await input({
            message: message,
        })
    }

    async askChoices<T>(
        message: string,
        choices: InteractionChoice<T>[],
        _?: InteractionOptions,
    ): Promise<T> {
        return await select({
            message: message,
            choices: choices.map((choice) => ({
                value: choice.value,
                name: choice.label,
            })),
        })
    }
}
