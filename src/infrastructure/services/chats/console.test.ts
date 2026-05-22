import { input, select } from "@inquirer/prompts"
import { expect, jest, test, beforeEach } from "@jest/globals"

import { PassThrough, Writable } from "node:stream"

const inputMock: jest.MockedFunction<typeof input> = jest.fn()
const selectMock = jest.fn() as jest.MockedFunction<typeof select>

jest.unstable_mockModule("@inquirer/prompts", () => ({
    input: inputMock,
    select: selectMock,
}))

const { ConsoleChat } = await import("./console.js")

let inputStream: PassThrough
let outputStream: Writable
let written = ""

beforeEach(() => {
    jest.clearAllMocks()

    inputStream = new PassThrough()
    outputStream = new Writable({
        write(chunk, _enc, cb) {
            written += chunk.toString()
            cb()
        },
    })
})
afterEach(() => {
    inputStream.destroy()
    outputStream.destroy()
    written = ""
})

describe("send", () => {
    test("should write message to output stream", async () => {
        const chat = new ConsoleChat(inputStream, outputStream)
        await chat.send("hello world")

        expect(written).toBe("hello world\n")
    })

    test("should reject when stream write fails", async () => {
        const failingOutputStream = new Writable({
            write(_chunk, _encoding, callback) {
                callback(new Error("write failed"))
            },
        }).on("error", () => {})

        const failingChat = new ConsoleChat(inputStream, failingOutputStream)

        await expect(failingChat.send("hello")).rejects.toThrow("write failed")
    })

    describe("stream integration", () => {
        test("should use the provided output stream", async () => {
            const chat = new ConsoleChat(inputStream, outputStream)
            await chat.send("first")
            await chat.send("second")

            expect(written).toBe("first\nsecond\n")
        })

        test("should accept a readable input stream", () => {
            expect(inputStream.readable).toBe(true)
        })

        test("should accept a writable output stream", () => {
            expect(outputStream.writable).toBe(true)
        })
    })
})

test("askText returns mocked input result", async () => {
    inputMock.mockResolvedValue("john")

    const chat = new ConsoleChat(inputStream, outputStream)

    const result = await chat.askText("What's your name?")

    expect(inputMock).toHaveBeenCalledWith(
        { message: "What's your name?" },
        { input: inputStream, output: outputStream },
    )

    expect(result).toBe("john")
})

test("askChoices returns mocked select result", async () => {
    selectMock.mockResolvedValue("rock")

    const chat = new ConsoleChat(inputStream, outputStream)

    const result = await chat.askChoices("pick", [
        { label: "Rock", value: "rock" },
        { label: "Paper", value: "paper" },
    ])

    expect(selectMock).toHaveBeenCalledWith(
        {
            message: "pick",
            choices: [
                { name: "Rock", value: "rock" },
                { name: "Paper", value: "paper" },
            ],
        },
        { input: inputStream, output: outputStream },
    )

    expect(result).toBe("rock")
})
