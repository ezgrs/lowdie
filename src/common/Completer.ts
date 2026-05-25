import { SessionTimeoutError } from "@/domain/errors/SessionTimeoutError.js"

export interface Completer<T> {
    resolve(value: T): void
    reject(error: any): void
}

export function createCompleter<T>(): [Completer<T>, Promise<T>] {
    let resolve!: (value: T) => void
    let reject!: (error: any) => void

    const promise = new Promise<T>((res, rej) => {
        resolve = res
        reject = rej
    })
    const completer = { resolve, reject }
    return [completer, promise]
}

export class TimedCompleter<T> implements Completer<T> {
    private readonly timeout: NodeJS.Timeout

    constructor(
        private readonly completer: Completer<T>,
        timeoutMs: number,
    ) {
        this.timeout = setTimeout(() => {
            completer.reject(new SessionTimeoutError())
        }, timeoutMs)
    }

    resolve(value: T): void {
        clearTimeout(this.timeout)
        this.completer.resolve(value)
    }

    reject(error: any): void {
        clearTimeout(this.timeout)
        this.completer.reject(error)
    }
}

export class AbortableCompleter<T> implements Completer<T> {
    constructor(
        private readonly completer: Completer<T>,
        private readonly signal: AbortSignal,
    ) {
        if (signal.aborted) {
            completer.reject(new DOMException("Aborted", "AbortError"))
        } else {
            signal.addEventListener("abort", this.abort)
        }
    }

    resolve(value: T): void {
        this.cleanup()
        this.completer.resolve(value)
    }

    reject(error: any): void {
        this.cleanup()
        this.completer.reject(error)
    }

    abort() {
        this.completer.reject(new DOMException("Aborted", "AbortError"))
        this.cleanup()
    }

    cleanup() {
        this.signal.removeEventListener("abort", this.abort)
    }
}
