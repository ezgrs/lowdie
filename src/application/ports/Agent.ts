export interface Agent {
    started(chatId: number): Promise<void>
    texted(chatId: number, text: string): Promise<void>
    answered(chatId: number, data: string): Promise<void>
    disposed(reason: string): Promise<void>
}
