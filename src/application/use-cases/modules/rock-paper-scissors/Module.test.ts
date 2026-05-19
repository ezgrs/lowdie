import { Move } from "@/src/domain/entities/RockPaperScissors.js"
import { RockPaperScissorsGame } from "./Module.js"
import { describe, expect, test, jest } from "@jest/globals"

let chooseMock: ReturnType<typeof jest.fn>
let game: RockPaperScissorsGame

beforeEach(() => {
    chooseMock = jest.fn(<T>(_items: T[]): T => {
        return "rock" as T
    })
    game = new RockPaperScissorsGame({
        randomizer: {
            choose: chooseMock,
            shuffle: (v) => [...v],
        },
    })
})

afterEach(() => {
    jest.clearAllMocks()
})

describe("getInitialState", () => {
    test.each(["rock", "paper", "scissors"])(
        "should return waitingForUser state when bot chooses %s",
        (chosenMove) => {
            chooseMock.mockReturnValueOnce(chosenMove)
            const result = game.getInitialState()

            expect(chooseMock).toHaveBeenCalledWith([
                "rock",
                "paper",
                "scissors",
            ])
            expect(result).toEqual({
                type: "waitingForUser",
                botMove: chosenMove,
            })
        },
    )
})

describe("applyEvent", () => {
    describe.each(["rock", "paper", "scissors"])(
        "when bot chooses %s",
        (botMove) => {
            test.each(["rock", "paper", "scissors"])(
                "should transition to done state when user chooses %s",
                (userMove) => {
                    const state = {
                        type: "waitingForUser",
                        botMove: botMove as Move,
                    } as const

                    const event = {
                        type: "userChose",
                        move: userMove as Move,
                    } as const

                    const result = game.applyEvent(state, event)

                    expect(result).toEqual({
                        type: "done",
                        botMove: botMove,
                        userMove: userMove,
                    })
                },
            )
        },
    )
})

describe("getAction", () => {
    describe("when in waitingForUser state", () => {
        test.each(["rock", "paper", "scissors"])(
            "should return select action with all possible moves when bot chooses %s",
            (botMove) => {
                const state = {
                    type: "waitingForUser",
                    botMove: botMove as Move,
                } as const

                const result = game.getAction(state)

                expect(result).toEqual({
                    type: "select",
                    choices: [
                        {
                            type: "userChose",
                            move: "rock",
                        },
                        {
                            type: "userChose",
                            move: "paper",
                        },
                        {
                            type: "userChose",
                            move: "scissors",
                        },
                    ],
                })
            },
        )
    })
})
