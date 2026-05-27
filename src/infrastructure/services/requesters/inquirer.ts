import { RenderedPrompt } from "@/application/ports/Prompt.js"
import { Requester } from "@/application/ports/Requester.js"
import { input, select } from "@inquirer/prompts"
import { Context } from "@inquirer/type"

type Args = {
    input: NodeJS.ReadableStream
    output: NodeJS.WritableStream
    signal?: AbortSignal | undefined
}

export class InquirerRequester<E> implements Requester<E> {
    private readonly signal: AbortSignal | undefined
    private readonly input: NodeJS.ReadableStream
    private readonly output: NodeJS.WritableStream

    constructor(args: Args) {
        this.signal = args.signal
        this.input = args.input
        this.output = args.output
    }

    async request(
        prompt: RenderedPrompt<E>,
        message: string,
    ): Promise<E | null> {
        const signal = this.signal
        const context: Context = { input: this.input, output: this.output }
        if (signal != null) {
            context.signal = signal
        }
        switch (prompt.type) {
            case "input":
                return await input(
                    {
                        message: message,
                    },
                    context,
                ).then(prompt.parser)
            case "select":
                return await select<E>(
                    {
                        message: message,
                        choices: prompt.choices.map((event, index) => ({
                            value: event,
                            name: prompt.labels[index]!,
                        })),
                    },
                    context,
                )
        }
    }
}
