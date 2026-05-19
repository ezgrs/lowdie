import { Event as BaseEvent } from "@/domain/entities/Event.js"
import { DiscriminatedUnion } from "@/common/utils.js"

declare const source: unique symbol

type Event = DiscriminatedUnion<{
    userSelected: { index: number }
}>

type AnnotatedBotEvent = Event & { [source]: "bot" }

export type BotEvent<E> = E | AnnotatedBotEvent

export function isBotEvent<E extends BaseEvent>(
    x: BotEvent<E>,
): x is AnnotatedBotEvent {
    return source in x
}

export function newBotEvent(event: Event): AnnotatedBotEvent {
    return { ...event, [source]: "bot" }
}
