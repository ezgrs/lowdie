import { describe, expect, test } from "@jest/globals"

import { isFinal, isNonFinal } from "./helpers.js"

describe("isFinal", () => {
    test("should return true when state type is done", () => {
        const state = {
            type: "done",
        }

        expect(isFinal(state)).toBe(true)
    })

    test("should return false when state type is not done", () => {
        const state = {
            type: "waitingForUser",
        }

        expect(isFinal(state)).toBe(false)
    })
})

describe("isNonFinal", () => {
    test("should return true when state type is not done", () => {
        const state = {
            type: "waitingForUser",
        }

        expect(isNonFinal(state)).toBe(true)
    })

    test("should return false when state type is done", () => {
        const state = {
            type: "done",
        }

        expect(isNonFinal(state)).toBe(false)
    })
})

describe("type narrowing", () => {
    test("should narrow to FinalState inside isFinal condition", () => {
        const state:
            | { type: "done"; result: string }
            | { type: "waitingForUser" } = {
            type: "done",
            result: "win",
        }

        if (isFinal(state)) {
            expect(state.result).toBe("win")
        }
    })

    test("should narrow to NonFinalState inside isNonFinal condition", () => {
        const state:
            | { type: "done"; result: string }
            | { type: "waitingForUser"; step: number } = {
            type: "waitingForUser",
            step: 1,
        }

        if (isNonFinal(state)) {
            expect(state.step).toBe(1)
        }
    })
})
