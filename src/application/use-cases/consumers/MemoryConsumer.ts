import { Consumer } from "@/application/ports/Consumer.js";
import { State } from "@/domain/states/State.js";

export class MemoryConsumer<S extends State> implements Consumer<S> {
    private state: S | undefined

    async provide(): Promise<S> {
        if (this.state == null) throw new Error("must call consume first")
        return this.state
    }

    async consume(state: S): Promise<void> {
        this.state = state
    }
}
