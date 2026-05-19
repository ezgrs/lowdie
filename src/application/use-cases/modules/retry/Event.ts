import { Event as BaseEvent } from "../../../../domain/entities/Event.js"
import { DiscriminatedUnion } from "../../../../common/utils.js"

declare const source: unique symbol

type Event = DiscriminatedUnion<{
    userProceeded: {}
    userCanceled: {}
}>

type AnnotatedRetryModuleEvent = Event & { [source]: "retry" }

export type RetryModuleEvent<E> = E | AnnotatedRetryModuleEvent

export function isRetryModuleEvent<E extends BaseEvent>(
    x: RetryModuleEvent<E>,
): x is AnnotatedRetryModuleEvent {
    return source in x
}

export function newRetryModuleEvent(event: Event): AnnotatedRetryModuleEvent {
    return { ...event, [source]: "retry" }
}
