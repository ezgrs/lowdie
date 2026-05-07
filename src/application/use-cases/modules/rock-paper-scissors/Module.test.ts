import { Move } from "../../../../domain/entities/RockPaperScissors.js"
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
        },
    })
})

afterEach(() => {
    jest.clearAllMocks()
})

describe("getInitialState", () => {
    test.each(["rock", "paper", "scissors"])(
        "should return waitingForUser state with bot move when randomizer chooses %s",
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
    test("should transition to done state when user chooses a move", () => {
        const state = {
            type: "waitingForUser",
            botMove: "scissors",
        } as const

        const event = {
            type: "userChose",
            move: "rock",
        } as const

        const result = game.applyEvent(state, event)

        expect(result).toEqual({
            type: "done",
            botMove: "scissors",
            userMove: "rock",
        })
    })
})

describe("getAction", () => {
    test.each(["rock", "paper", "scissors"])(
        "should return select action with all possible moves when in waitingForUser state and bot move is %s",
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
