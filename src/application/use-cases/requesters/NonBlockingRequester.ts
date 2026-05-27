import { RenderedPrompt } from "@/application/ports/Prompt.js"
import { Requester } from "@/application/ports/Requester.js"
import { AsyncStream } from "@/common/AsyncStream.js"

type Args<T> = {
    stream: AsyncStream<T | null>
    requester: Requester<T>
}

export class NonBlockingRequester<T> implements Requester<T> {
    private readonly stream: AsyncStream<T | null>
    private readonly requester: Requester<T>

    constructor(args: Args<T>) {
        this.stream = args.stream
        this.requester = args.requester
    }

    async request(
        prompt: RenderedPrompt<T>,
        message: string,
    ): Promise<T | null> {
        this.requester.request(prompt, message).then(this.stream.add)
        return null
    }
}
