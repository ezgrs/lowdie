export interface Consumer<T> {
    provide(): Promise<T>
    consume(value: T): Promise<void>
}
