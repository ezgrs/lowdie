import { Event as BaseEvent } from "@/domain/entities/Event.js"
import { DiscriminatedUnion } from "@/common/utils.js"

const source: unique symbol = Symbol("source")

type Event = DiscriminatedUnion<{
    userSelected: { index: number }
}>

type AnnotatedBotEvent = Event & { [source]: "bot" }

export type BotEvent<E> = E | AnnotatedBotEvent

export function isBotEvent<E extends BaseEvent>(
    x: BotEvent<E>,
): x is AnnotatedBotEvent {
    return (
        typeof x === "object" &&
        x !== null &&
        source in x &&
        x[source] === "bot"
    )
}

export function newBotEvent(event: Event): AnnotatedBotEvent {
    return { ...event, [source]: "bot" }
}
