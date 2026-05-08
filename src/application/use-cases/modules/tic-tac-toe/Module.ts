import { Action } from "../../../../domain/entities/Action.js"
import { NonFinalState } from "../../../../domain/entities/State.js"
import { TicTacToeBoard } from "../../../../domain/services/tic-tac-toe/board.js"
import { strategyFromDifficulty } from "../../../../domain/services/tic-tac-toe/strategy.js"
import {
    oppositeSymbolOf,
    gameResultOf,
} from "../../../../domain/services/TicTacToe.js"
import { Module } from "../../../ports/Module.js"
import { Randomizer } from "../../../ports/Randomizer.js"
import { TicTacToeGameEvent } from "./Event.js"
import { TicTacToeGameState } from "./State.js"

type Args = {
    randomizer: Randomizer
}

export class TicTacToeGame implements Module<
    TicTacToeGameState,
    TicTacToeGameEvent
> {
    private readonly randomizer: Randomizer

    constructor(args: Args) {
        this.randomizer = args.randomizer
    }

    getInitialState(): NonFinalState<TicTacToeGameState> {
        return {
            type: "settingUp",
            difficulty: "easy",
            playerSymbol: "X",
            property: undefined,
        }
    }

    applyEvent(
        state: NonFinalState<TicTacToeGameState>,
        event: TicTacToeGameEvent,
    ): TicTacToeGameState {
        switch (event.type) {
            case "userStartedPropertySetup":
                switch (state.type) {
                    case "settingUp":
                        if (state.property != null) {
                            throw new Error()
                        }
                        return {
                            type: "settingUp",
                            difficulty: state.difficulty,
                            playerSymbol: state.playerSymbol,
                            property: event.property,
                        }
                    default:
                        throw new Error()
                }
            case "userUpdatedProperty":
                switch (state.type) {
                    case "settingUp":
                        if (state.property == null) {
                            throw new Error()
                        }
                        switch (event.property) {
                            case "difficulty":
                                return {
                                    type: "settingUp",
                                    playerSymbol: state.playerSymbol,
                                    difficulty: event.value,
                                    property: undefined,
                                }
                            case "playerSymbol":
                                return {
                                    type: "settingUp",
                                    difficulty: state.difficulty,
                                    playerSymbol: event.value,
                                    property: undefined,
                                }
                        }
                    default:
                        throw new Error()
                }
            case "userCanceledPropertySetup":
                switch (state.type) {
                    case "settingUp":
                        if (state.property == null) {
                            throw new Error()
                        }
                        return {
                            type: "settingUp",
                            difficulty: state.difficulty,
                            playerSymbol: state.playerSymbol,
                            property: undefined,
                        }
                    default:
                        throw new Error()
                }
            case "userStartedGame":
                switch (state.type) {
                    case "settingUp":
                        const strategy = strategyFromDifficulty(
                            state.difficulty,
                            this.randomizer,
                        )
                        let board = new TicTacToeBoard({
                            matrix: Array.from({ length: 3 }, () =>
                                Array.from({ length: 3 }, () => null),
                            ),
                            randomizer: this.randomizer,
                        })
                        if (state.playerSymbol == "O") {
                            board = board.apply(
                                oppositeSymbolOf(state.playerSymbol),
                                strategy.nextMove(
                                    board.matrix,
                                    state.playerSymbol,
                                ),
                            )!
                        }
                        return {
                            type: "playing",
                            board: board,
                            playerSymbol: state.playerSymbol,
                            strategy: strategy,
                        }
                    default:
                        throw new Error()
                }
            case "userMarkedSymbol":
                switch (state.type) {
                    case "playing":
                        let board: TicTacToeBoard | undefined
                        board = state.board.apply(state.playerSymbol, {
                            type: "exact",
                            coordinates: [event.row, event.col],
                        })
                        if (board == null) {
                            return {
                                type: "playing",
                                board: state.board,
                                playerSymbol: state.playerSymbol,
                                strategy: state.strategy,
                            }
                        }
                        let result = gameResultOf(
                            board.matrix,
                            state.playerSymbol,
                        )
                        if (result != null) {
                            return { type: "done", result: result }
                        }

                        board = board.apply(
                            oppositeSymbolOf(state.playerSymbol),
                            state.strategy.nextMove(
                                board.matrix,
                                state.playerSymbol,
                            ),
                        )
                        if (board == null) {
                            return { type: "done", result: "draw" }
                        }
                        result = gameResultOf(board.matrix, state.playerSymbol)
                        if (result != null) {
                            return { type: "done", result: result }
                        }
                        return {
                            type: "playing",
                            board: board,
                            playerSymbol: state.playerSymbol,
                            strategy: state.strategy,
                        }
                    default:
                        throw new Error()
                }
        }
    }

    getAction(
        state: NonFinalState<TicTacToeGameState>,
    ): Action<TicTacToeGameEvent> {
        switch (state.type) {
            case "settingUp":
                switch (state.property) {
                    case undefined:
                        return {
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
                        }
                    case "difficulty":
                        return {
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
                        }
                    case "playerSymbol":
                        return {
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
                        }
                }
            case "playing":
                return {
                    type: "input",
                    parser: (text) => {
                        const match = /^([A-C])([1-3])$/.exec(text)
                        if (!match) return null

                        const [, rowLetter, colNumber] = match
                        if (rowLetter == null) return null
                        if (colNumber == null) return null
                        return {
                            type: "userMarkedSymbol",
                            row: rowLetter.charCodeAt(0) - "A".charCodeAt(0),
                            col: Number(colNumber) - 1,
                        }
                    },
                }
        }
    }
}
