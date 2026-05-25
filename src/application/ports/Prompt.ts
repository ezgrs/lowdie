type SelectPrompt<E> = { type: "select"; choices: E[] }
type InputPrompt<E> = { type: "input"; parser: (input: string) => E | null }
export type Prompt<E> = SelectPrompt<E> | InputPrompt<E>

export type RenderedPrompt<E> =
    | InputPrompt<E>
    | (SelectPrompt<E> & { labels: string[] })
