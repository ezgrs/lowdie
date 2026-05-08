export type Action<E> =
    | {
          type: "select"
          choices: E[]
      }
    | {
          type: "input"
          parser: (input: string) => E | null
      }
