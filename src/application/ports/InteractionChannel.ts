export type InteractionChoice<T> = {
    value: T
    label: string
}

export type InteractionOptions = {
    signal?: AbortSignal | undefined
    sessionTtlMs?: number | undefined
}

export interface InteractionChannel {
    send(message: string): Promise<void>

    askText(
        message: string,
        options: InteractionOptions | undefined,
    ): Promise<string>

    askChoices<T>(
        message: string,
        choices: InteractionChoice<T>[],
        options: InteractionOptions | undefined,
    ): Promise<T>
}
