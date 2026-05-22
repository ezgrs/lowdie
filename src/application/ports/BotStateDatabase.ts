import { BotState } from "@/domain/states/BotState.js"

export interface BotStateDatabase {
    set(chatId: number, state: BotState): Promise<void>
    get(chatId: number): Promise<BotState | undefined>
}
