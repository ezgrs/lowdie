import { Action } from "../../../../domain/entities/Action.js"
import {
    TicTacToeDifficulty,
    TicTacToeSymbol,
} from "../../../../domain/entities/TicTacToe.js"
import { TicTacToeBoard } from "../../../../domain/services/tic-tac-toe/board.js"
import {
    EasyTicTacToeStrategy,
    HardTicTacToeStrategy,
    NormalTicTacToeStrategy,
    TicTacToeStrategy,
} from "../../../../domain/services/tic-tac-toe/strategy.js"
import { Randomizer } from "../../../ports/Randomizer.js"
import { TicTacToeGameEvent } from "./Event.js"
import { TicTacToeGame } from "./Module.js"
import { describe, expect, test, jest } from "@jest/globals"

let randomizer: jest.Mocked<Randomizer>
let game: TicTacToeGame

beforeEach(() => {
    randomizer = {
        choose: jest.fn<<T>(values: readonly T[]) => T>(
            <T>(values: readonly T[]): T => values[0]!,
        ) as ReturnType<typeof jest.fn>,
        shuffle: jest.fn(<T>(values: readonly T[]): T[] => [
            ...values,
        ]) as ReturnType<typeof jest.fn>,
    }
    game = new TicTacToeGame({
        randomizer: randomizer,
    })
})

afterEach(() => {
    jest.clearAllMocks()
})

describe("given getInitialState is called", () => {
    test("then return settingUp state", () => {
        const result = game.getInitialState()

        expect(randomizer.choose).not.toHaveBeenCalled()
        expect(randomizer.shuffle).not.toHaveBeenCalled()
        expect(result).toEqual({
            type: "settingUp",
            difficulty: "easy",
            playerSymbol: "X",
            property: undefined,
        })
    })
})

describe("getAction", () => {
    describe("given state is playing", () => {
        describe.each([
            new EasyTicTacToeStrategy(),
            new NormalTicTacToeStrategy(new EasyTicTacToeStrategy()),
            new HardTicTacToeStrategy({
                randomizer: randomizer,
                strategy: new NormalTicTacToeStrategy(
                    new EasyTicTacToeStrategy(),
                ),
            }),
        ] as TicTacToeStrategy[])("given strategy is %s", (strategy) => {
            describe.each(["X", "O"] as TicTacToeSymbol[])(
                "given playerSymbol is %s",
                (playerSymbol) => {
                    const board = new TicTacToeBoard({
                        matrix: [],
                        randomizer: randomizer,
                    })
                    describe("when getAction is called", () => {
                        let action: Action<TicTacToeGameEvent>
                        beforeAll(() => {
                            action = game.getAction({
                                type: "playing",
                                board: board,
                                strategy: strategy,
                                playerSymbol: playerSymbol,
                            })
                        })
                        test("then it should return input action", () => {
                            expect(action.type).toBe("input")
                        })
                        test.each(["", "foo", "bar", "A0", "D1", "D0"])(
                            "then it should not parse invalid strings",
                            (text) => {
                                if (action.type === "input") {
                                    expect(action.parser(text)).toBe(null)
                                } else {
                                    throw Error()
                                }
                            },
                        )
                        test.each(
                            "ABC".split("").flatMap((letter, r) =>
                                "123".split("").map((number, c) => ({
                                    input: `${letter}${number}`,
                                    row: r,
                                    col: c,
                                })),
                            ),
                        )(
                            "then it should parse valid strings with valid coordinates",
                            (obj) => {
                                if (action.type === "input") {
                                    expect(action.parser(obj.input)).toEqual({
                                        type: "userMarkedSymbol",
                                        row: obj.row,
                                        col: obj.col,
                                    })
                                } else {
                                    throw Error()
                                }
                            },
                        )
                    })
                },
            )
        })
    })
    describe("given state is settingUp", () => {
        describe.each(["easy", "normal", "hard"] as TicTacToeDifficulty[])(
            "given initial difficulty is %s",
            (initialDifficulty) => {
                describe.each(["X", "O"] as TicTacToeSymbol[])(
                    "given initial playerSymbol is %s",
                    (initialPlayerSymbol) => {
                        test("when property is undefined, then it should return general setup choices", () => {
                            const action = game.getAction({
                                type: "settingUp",
                                difficulty: initialDifficulty,
                                playerSymbol: initialPlayerSymbol,
                                property: undefined,
                            })
                            expect(randomizer.choose).not.toHaveBeenCalled()
                            expect(randomizer.shuffle).not.toHaveBeenCalled()
                            expect(action).toEqual({
                                type: "select",
                                choices: [
                                    {
                                        type: "userStartedPropertySetup",
                                        property: "difficulty",
                                    },
                                    {
                                        type: "userStartedPropertySetup",
                                        property: "playerSymbol",
                                    },
                                    { type: "userStartedGame" },
                                ],
                            })
                        })
                        test("when property is difficulty, then it should return respective setup choices", () => {
                            const action = game.getAction({
                                type: "settingUp",
                                difficulty: initialDifficulty,
                                playerSymbol: initialPlayerSymbol,
                                property: "difficulty",
                            })
                            expect(randomizer.choose).not.toHaveBeenCalled()
                            expect(randomizer.shuffle).not.toHaveBeenCalled()
                            expect(action).toEqual({
                                type: "select",
                                choices: [
                                    {
                                        type: "userUpdatedProperty",
                                        property: "difficulty",
                                        value: "easy",
                                    },
                                    {
                                        type: "userUpdatedProperty",
                                        property: "difficulty",
                                        value: "normal",
                                    },
                                    {
                                        type: "userUpdatedProperty",
                                        property: "difficulty",
                                        value: "hard",
                                    },
                                    {
                                        type: "userCanceledPropertySetup",
                                    },
                                ],
                            })
                        })
                        test("when property is playerSymbol, then it should return respective setup choices", () => {
                            const action = game.getAction({
                                type: "settingUp",
                                difficulty: initialDifficulty,
                                playerSymbol: initialPlayerSymbol,
                                property: "playerSymbol",
                            })
                            expect(randomizer.choose).not.toHaveBeenCalled()
                            expect(randomizer.shuffle).not.toHaveBeenCalled()
                            expect(action).toEqual({
                                type: "select",
                                choices: [
                                    {
                                        type: "userUpdatedProperty",
                                        property: "playerSymbol",
                                        value: "X",
                                    },
                                    {
                                        type: "userUpdatedProperty",
                                        property: "playerSymbol",
                                        value: "O",
                                    },
                                    {
                                        type: "userCanceledPropertySetup",
                                    },
                                ],
                            })
                        })
                    },
                )
            },
        )
    })
})
