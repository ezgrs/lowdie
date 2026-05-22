import { describe, expect, test } from "@jest/globals"
import { evaluateGame } from "./rules.js"

describe("evaluateGame", () => {
    describe("when the moves are the same", () => {
        test("should return draw for rock vs rock", () => {
            expect(evaluateGame("rock", "rock")).toBe("draw")
        })

        test("should return draw for paper vs paper", () => {
            expect(evaluateGame("paper", "paper")).toBe("draw")
        })

        test("should return draw for scissors vs scissors", () => {
            expect(evaluateGame("scissors", "scissors")).toBe("draw")
        })
    })

    describe("when the bot wins", () => {
        test("should return lose for user when rock beats scissors", () => {
            expect(evaluateGame("rock", "scissors")).toBe("lose")
        })

        test("should return lose for user when paper beats rock", () => {
            expect(evaluateGame("paper", "rock")).toBe("lose")
        })

        test("should return lose for user when scissors beats paper", () => {
            expect(evaluateGame("scissors", "paper")).toBe("lose")
        })
    })

    describe("when the user wins", () => {
        test("should return win when rock beats scissors", () => {
            expect(evaluateGame("scissors", "rock")).toBe("win")
        })

        test("should return win when paper beats rock", () => {
            expect(evaluateGame("rock", "paper")).toBe("win")
        })

        test("should return win when scissors beats paper", () => {
            expect(evaluateGame("paper", "scissors")).toBe("win")
        })
    })
})
