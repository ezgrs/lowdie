import { IO } from "../../../domain/services/io";

export class ConsoleIO implements IO {
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