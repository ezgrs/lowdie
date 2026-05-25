import { Context } from "@inquirer/type"
import { input, select } from "@inquirer/prompts"
import { RenderedPrompt } from "@/application/ports/Prompt.js"
import { Chat, PromptOutput } from "@/application/ports/Chat.js"

type Args = {
    input: NodeJS.ReadableStream
    output: NodeJS.WritableStream
    signal?: AbortSignal | undefined
}

export class ConsoleChat<E> implements Chat<E> {
    private readonly input: NodeJS.ReadableStream
    private readonly output: NodeJS.WritableStream
    private readonly signal: AbortSignal | undefined

    constructor(args: Args) {
        this.input = args.input
        this.output = args.output
        this.signal = args.signal
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
    ): Promise<PromptOutput<E>> {
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
        if (event == null) return { type: "invalid" }
        return { type: "proceed", value: event }
    }
}
