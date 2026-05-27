export interface Inbox<D> {
    started(): Promise<void>
    texted(text: string): Promise<void>
    answered(data: D): Promise<void>
}
