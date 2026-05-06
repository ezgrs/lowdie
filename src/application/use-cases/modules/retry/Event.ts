import { DiscriminatedUnion } from "../../../../common/utils.js"

export type RetryModuleEvent<E> = DiscriminatedUnion<{
    subEventEmitted: { wrapped: E }
    userProceeded: {}
    userCanceled: {}
}>
