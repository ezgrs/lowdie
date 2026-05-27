import { Context } from "@inquirer/type"
import { input, select } from "@inquirer/prompts"
import { RenderedPrompt } from "@/application/ports/Prompt.js"
import { Chat } from "@/application/ports/Chat.js"
import { Trigger } from "@/application/ports/Trigger.js"

type Args<E> = {
    input: NodeJS.ReadableStream
    output: NodeJS.WritableStream
    signal?: AbortSignal | undefined
    trigger: Trigger<E>
}

export class ConsoleChat<E> implements Chat<E> {
    private readonly input: NodeJS.ReadableStream
    private readonly output: NodeJS.WritableStream
    private readonly signal: AbortSignal | undefined
    private readonly trigger: Trigger<E>

    constructor(args: Args<E>) {
        this.input = args.input
        this.output = args.output
        this.signal = args.signal
        this.trigger = args.trigger
    }

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

    async ask(
        prompt: RenderedPrompt<E>,
        message: string,
    ): Promise<void> {
        const signal = this.signal
        const context: Context = { input: this.input, output: this.output }
        if (signal != null) {
            context.signal = signal
        }

        let event: E | null
        switch (prompt.type) {
            case "input":
                event = await input(
                    {
                        message: message,
                    },
                    context,
                ).then(prompt.parser)
                break
            case "select":
                event = await select<E>(
                    {
                        message: message,
                        choices: prompt.choices.map((event, index) => ({
                            value: event,
                            name: prompt.labels[index]!,
                        })),
                    },
                    context,
                )
                break
        }
        if (event == null) throw new Error("invalid")
        await this.trigger.do(event)
    }
}
