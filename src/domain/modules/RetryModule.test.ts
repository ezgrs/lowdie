import { beforeEach, describe, expect, jest, test } from "@jest/globals"
import { RetryModule } from "./RetryModule.js"

let wrappedModule: {
    getInitialState: ReturnType<typeof jest.fn>
    applyEvent: ReturnType<typeof jest.fn>
    getAction: ReturnType<typeof jest.fn>
}

let retryModule: RetryModule<any, any>

beforeEach(() => {
    wrappedModule = {
        getInitialState: jest.fn(),
        applyEvent: jest.fn(),
        getAction: jest.fn(),
    }

    retryModule = new RetryModule(wrappedModule)
})

afterEach(() => {
    jest.clearAllMocks()
})

describe("getInitialState", () => {
    test("should return active state with wrapped initial state", () => {
        wrappedModule.getInitialState.mockReturnValue({
            type: "playing",
        })

        const result = retryModule.getInitialState()

        expect(wrappedModule.getInitialState).toHaveBeenCalled()

        expect(result).toEqual({
            type: "active",
            wrapped: {
                type: "playing",
            },
        })
    })
})

describe("applyEvent", () => {
    describe("when receiving subEventEmitted", () => {
        test("should stay active when wrapped module returns non-final state", () => {
            wrappedModule.applyEvent.mockReturnValue({
                type: "playing",
            })

            const result = retryModule.applyEvent(
                {
                    type: "active",
                    wrapped: {
                        type: "playing",
                    },
                },
                {
                    type: "subEventEmitted",
                    wrapped: {
                        type: "moveMade",
                    },
                },
            )

            expect(wrappedModule.applyEvent).toHaveBeenCalledWith(
                { type: "playing" },
                { type: "moveMade" },
            )

            expect(result).toEqual({
                type: "active",
                wrapped: {
                    type: "playing",
                },
            })
        })

        test("should transition to waiting when wrapped module returns final state", () => {
            wrappedModule.applyEvent.mockReturnValue({
                type: "done",
                result: "win",
            })

            const result = retryModule.applyEvent(
                {
                    type: "active",
                    wrapped: {
                        type: "playing",
                    },
                },
                {
                    type: "subEventEmitted",
                    wrapped: {
                        type: "moveMade",
                    },
                },
            )

            expect(result).toEqual({
                type: "waiting",
                wrapped: {
                    type: "done",
                    result: "win",
                },
            })
        })

        test("should throw when subEventEmitted is received in waiting state", () => {
            expect(() =>
                retryModule.applyEvent(
                    {
                        type: "waiting",
                        wrapped: {
                            type: "done",
                        },
                    },
                    {
                        type: "subEventEmitted",
                        wrapped: {},
                    },
                ),
            ).toThrow()
        })
    })

    describe("when receiving userProceeded", () => {
        test("should restart the wrapped module from waiting state", () => {
            wrappedModule.getInitialState.mockReturnValue({
                type: "playing",
            })

            const result = retryModule.applyEvent(
                {
                    type: "waiting",
                    wrapped: {
                        type: "done",
                    },
                },
                {
                    type: "userProceeded",
                },
            )

            expect(result).toEqual({
                type: "active",
                wrapped: {
                    type: "playing",
                },
            })
        })

        test("should throw when userProceeded is received in active state", () => {
            expect(() =>
                retryModule.applyEvent(
                    {
                        type: "active",
                        wrapped: {
                            type: "playing",
                        },
                    },
                    {
                        type: "userProceeded",
                    },
                ),
            ).toThrow()
        })
    })

    describe("when receiving userCanceled", () => {
        test("should finish retry module from waiting state", () => {
            const result = retryModule.applyEvent(
                {
                    type: "waiting",
                    wrapped: {
                        type: "done",
                        result: "lose",
                    },
                },
                {
                    type: "userCanceled",
                },
            )

            expect(result).toEqual({
                type: "done",
                wrapped: {
                    type: "done",
                    result: "lose",
                },
            })
        })

        test("should throw when userCanceled is received in active state", () => {
            expect(() =>
                retryModule.applyEvent(
                    {
                        type: "active",
                        wrapped: {
                            type: "playing",
                        },
                    },
                    {
                        type: "userCanceled",
                    },
                ),
            ).toThrow()
        })
    })
})

describe("getAction", () => {
    describe("when wrapped action is select", () => {
        test("should wrap select choices as sub events", () => {
            wrappedModule.getAction.mockReturnValue({
                type: "select",
                choices: [{ type: "moveA" }, { type: "moveB" }],
            })

            const result = retryModule.getAction({
                type: "active",
                wrapped: {
                    type: "playing",
                },
            })

            expect(result).toEqual({
                type: "select",
                choices: [
                    {
                        type: "subEventEmitted",
                        wrapped: {
                            type: "moveA",
                        },
                    },
                    {
                        type: "subEventEmitted",
                        wrapped: {
                            type: "moveB",
                        },
                    },
                ],
            })
        })
    })

    describe("when wrapped action is input", () => {
        test("should wrap parser results as sub events", () => {
            wrappedModule.getAction.mockReturnValue({
                type: "input",
                parser: (input: string) => ({
                    type: "submitted",
                    value: input,
                }),
            })

            const result = retryModule.getAction({
                type: "active",
                wrapped: {
                    type: "playing",
                },
            })

            expect(result.type).toBe("input")

            if (result.type !== "input") {
                throw new Error("Expected input action")
            }

            expect(result.parser("hello")).toEqual({
                type: "subEventEmitted",
                wrapped: {
                    type: "submitted",
                    value: "hello",
                },
            })
        })
    })

    describe("when state is waiting", () => {
        test("should return proceed and cancel actions", () => {
            const result = retryModule.getAction({
                type: "waiting",
                wrapped: {
                    type: "done",
                },
            })

            expect(result).toEqual({
                type: "select",
                choices: [
                    {
                        type: "userProceeded",
                    },
                    {
                        type: "userCanceled",
                    },
                ],
            })
        })
    })
})
