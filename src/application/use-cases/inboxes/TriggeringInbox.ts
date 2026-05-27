import { Inbox } from "@/application/ports/Inbox.js";
import { Prompt } from "@/application/ports/Prompt.js";
import { Trigger } from "@/application/ports/Trigger.js";
import { Event } from "@/domain/events/Event.js";

type Args<E extends Event> = {
    provider: () => Promise<Prompt<E> | null>
    trigger: Trigger<E>
}

export class TriggeringInbox<E extends Event> implements Inbox<E> {
    private readonly provider: () => Promise<Prompt<E> | null>
    private readonly trigger: Trigger<E | null>

    constructor(args: Args<E>) {
        this.provider = args.provider
        this.trigger = args.trigger
    }
    
    async started(): Promise<void> {}
    
    async texted(text: string): Promise<void> {
        const prompt = await this.provider()
        if (prompt == null) return
        switch (prompt.type) {
            case "input":
                const event = prompt.parser(text)
                await this.trigger.do(event)
                break
            default:
                return
        }
    }

    async answered(event: E): Promise<void> {
        const prompt = await this.provider()
        if (prompt == null) return
        switch (prompt.type) {
            case "select":
                await this.trigger.do(event)
                break
            default:
                console.log("answered: expected a select action")
                return await this.started()
        }
    }

}