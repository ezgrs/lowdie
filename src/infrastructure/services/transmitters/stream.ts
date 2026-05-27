import { RenderedPrompt } from "@/application/ports/Prompt.js"
import { Transmitter } from "@/application/ports/Transmitter.js"
import { Requester } from "@/application/ports/Requester.js"

type Args<E> = {
    output: NodeJS.WritableStream
    requester: Requester<E>
}

export class StreamTransmitter<E> implements Transmitter<E> {
    private readonly requester: Requester<E>
    private readonly output: NodeJS.WritableStream

    constructor(args: Args<E>) {
        this.output = args.output
        this.requester = args.requester
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

    async ask(prompt: RenderedPrompt<E>, message: string): Promise<void> {
        await this.requester.request(prompt, message)
    }
}
