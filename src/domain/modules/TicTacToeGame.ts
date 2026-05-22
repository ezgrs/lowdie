import { Action } from "@/domain/Action.js"
import { Randomizer } from "@/application/ports/Randomizer.js"
import { TicTacToeGameState } from "@/domain/states/TicTacToeGameState.js"
import { TicTacToeGameEvent } from "@/domain/events/TicTacToeGameEvent.js"
import { UnexpectedModuleFlow } from "../errors/UnexpectedModuleFlowError.js"
import { NonFinalState } from "../states/State.js"
import { oppositeSymbolOf, gameResultOf } from "../tic-tac-toe/rules.js"
import { strategyFromDifficulty } from "../tic-tac-toe/strategy.js"
import { TicTacToeBoard } from "../tic-tac-toe/TicTacToeBoard.js"
import { Module } from "./Module.js"

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
                            throw new UnexpectedModuleFlow(
                                event.type,
                                state.type,
                                `state.property=${state.property}`,
                            )
                        }
                        return {
                            type: "settingUp",
                            difficulty: state.difficulty,
                            playerSymbol: state.playerSymbol,
                            property: event.property,
                        }
                }
                throw new UnexpectedModuleFlow(event.type, state.type)
            case "userUpdatedProperty":
                switch (state.type) {
                    case "settingUp":
                        if (state.property == null) {
                            throw new UnexpectedModuleFlow(
                                event.type,
                                state.type,
                                `state.property=null`,
                            )
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
                }
                throw new UnexpectedModuleFlow(event.type, state.type)
            case "userCanceledPropertySetup":
                switch (state.type) {
                    case "settingUp":
                        if (state.property == null) {
                            throw new UnexpectedModuleFlow(
                                event.type,
                                state.type,
                                `state.property=null`,
                            )
                        }
                        return {
                            type: "settingUp",
                            difficulty: state.difficulty,
                            playerSymbol: state.playerSymbol,
                            property: undefined,
                        }
                }
                throw new UnexpectedModuleFlow(event.type, state.type)
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
                }
                throw new UnexpectedModuleFlow(event.type, state.type)
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
                }
                throw new UnexpectedModuleFlow(event.type, state.type)
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
                        return {
                            type: "userMarkedSymbol",
                            row: rowLetter!.charCodeAt(0) - "A".charCodeAt(0),
                            col: Number(colNumber) - 1,
                        }
                    },
                }
        }
    }
}
