export interface Trigger<E> {
    do(event: E): Promise<void>
}