import { Completer, createCompleter } from "./Completer.js"

export class AsyncStream<T> {
    private readonly queue: T[] = []
    private readonly completers: Completer<T>[] = []

    add(value: T) {
        const completer = this.completers.shift()
        if (completer) {
            completer.resolve(value)
        } else {
            this.queue.push(value)
        }
    }

    async next(): Promise<T> {
        const value = this.queue.shift()
        if (value != null) {
            return value
        }
        const [completer, promise] = createCompleter<T>()
        this.completers.push(completer)
        return promise
    }
}
