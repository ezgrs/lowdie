import { input, select } from "@inquirer/prompts"
import {
    InteractionChannel,
    InteractionChoice,
    InteractionOptions,
} from "../../../application/ports/InteractionChannel.js"

export class ConsoleInteractionChannel implements InteractionChannel {
    constructor(
        private input: NodeJS.ReadableStream,
        private output: NodeJS.WritableStream,
    ) {}

    async send(message: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.output.write(message + "\n", (error) => {
                if (error) {
                    reject(error)
                    return
                }
                resolve()
            })
        })
    }

    async askText(message: string, _?: InteractionOptions): Promise<string> {
        return await input(
            {
                message: message,
            },
            { input: this.input, output: this.output },
        )
    }

    async askChoices<T>(
        message: string,
        choices: InteractionChoice<T>[],
        _?: InteractionOptions,
    ): Promise<T> {
        return await select(
            {
                message: message,
                choices: choices.map((choice) => ({
                    value: choice.value,
                    name: choice.label,
                })),
            },
            { input: this.input, output: this.output },
        )
    }
}
