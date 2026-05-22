export interface ChatDatabase<T> {
    set(chatId: number, value: T): Promise<void>
    get(chatId: number): Promise<T | undefined>
}
