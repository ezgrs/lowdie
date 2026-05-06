export interface Stream {
    output(message: string): Promise<void>
    input(): Promise<string>
}
