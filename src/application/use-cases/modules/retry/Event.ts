import { Event as BaseEvent } from "@/domain/entities/Event.js"
import { DiscriminatedUnion } from "@/common/utils.js"

type Event = DiscriminatedUnion<{
    userProceeded: {}
    userCanceled: {}
}>

type AnnotatedRetryModuleEvent = Event & { tag: "retry" }

export type RetryModuleEvent<E> = E | AnnotatedRetryModuleEvent

export function isRetryModuleEvent<E extends BaseEvent>(
    x: RetryModuleEvent<E>,
): x is AnnotatedRetryModuleEvent {
    return (
        typeof x === "object" && x !== null && "tag" in x && x.tag === "retry"
    )
}

export function newRetryModuleEvent(event: Event): AnnotatedRetryModuleEvent {
    return { ...event, tag: "retry" }
}
