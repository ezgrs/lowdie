export interface Inbox<D> {
    started(chatId: number): Promise<void>
    texted(chatId: number, text: string): Promise<void>
    answered(chatId: number, data: D): Promise<void>
    disposed(reason: string): Promise<void>
}
