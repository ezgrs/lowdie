import {
    describe,
    expect,
    test,
    jest,
    beforeEach,
    afterEach,
} from "@jest/globals"

import { PseudoRandomizer } from "./pseudo.js"

let randomSpy: jest.SpiedFunction<typeof Math.random>
let randomizer: PseudoRandomizer

beforeEach(() => {
    randomizer = new PseudoRandomizer()
})

afterEach(() => {
    randomSpy?.mockRestore()
})

describe("choose", () => {
    test("should return the first value when Math.random is near 0", () => {
        randomSpy = jest.spyOn(Math, "random").mockReturnValue(0)

        const result = randomizer.choose(["rock", "paper", "scissors"])

        expect(result).toBe("rock")
    })

    test("should return a middle value", () => {
        randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.5)

        const result = randomizer.choose(["rock", "paper", "scissors"])

        expect(result).toBe("paper")
    })

    test("should return the last value when Math.random is close to 1", () => {
        randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.999999)

        const result = randomizer.choose(["rock", "paper", "scissors"])

        expect(result).toBe("scissors")
    })

    test("should work with generic types", () => {
        randomSpy = jest.spyOn(Math, "random").mockReturnValue(0)

        const values = [{ id: 1 }, { id: 2 }]

        const result = randomizer.choose(values)

        expect(result).toEqual({ id: 1 })
    })
})
