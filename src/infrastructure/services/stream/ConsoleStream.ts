import { Stream } from "../../../application/ports/Stream.js"

export class ConsoleStream implements Stream {
    stdin: NodeJS.ReadStream

    constructor(stdin: NodeJS.ReadStream) {
        this.stdin = stdin
    }

    async input(): Promise<string> {
        return new Promise((resolve) => {
            this.stdin.on("data", (data) => resolve(data.toString().trim()))
        })
    }

    async output(message: string): Promise<void> {
        console.log(message)
    }
}
