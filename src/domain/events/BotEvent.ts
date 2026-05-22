import { Event as BaseEvent } from "./Event.js"
import { DiscriminatedUnion } from "@/common/utils.js"

type Event = DiscriminatedUnion<{
    userSelected: { index: number }
}>

type AnnotatedBotEvent = Event & { tag: "bot" }

export type BotEvent<E> = E | AnnotatedBotEvent

export function isBotEvent<E extends BaseEvent>(
    x: BotEvent<E>,
): x is AnnotatedBotEvent {
    return typeof x === "object" && x !== null && "tag" in x && x.tag === "bot"
}

export function newBotEvent(event: Event): AnnotatedBotEvent {
    return { ...event, tag: "bot" }
}
