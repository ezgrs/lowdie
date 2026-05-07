export type InteractionChoice<T> = {
    value: T
    label: string
}

export type InteractionOptions = {
    timeoutMs?: number
}

export interface InteractionChannel {
    send(message: string): Promise<void>

    askText(message: string): Promise<string>
    askText(message: string, options: InteractionOptions): Promise<string>

    askChoices<T>(message: string, choices: InteractionChoice<T>[]): Promise<T>
    askChoices<T>(
        message: string,
        choices: InteractionChoice<T>[],
        options: InteractionOptions,
    ): Promise<T>
}
