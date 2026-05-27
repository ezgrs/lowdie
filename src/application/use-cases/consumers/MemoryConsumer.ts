import { Consumer } from "@/application/ports/Consumer.js"

export class MemoryConsumer<T> implements Consumer<T> {
    constructor(private value: T) {}

    async provide(): Promise<T> {
        return this.value
    }

    async consume(value: T): Promise<void> {
        this.value = value
    }
}
