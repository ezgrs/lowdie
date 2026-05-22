import { GameResult } from "../GameResult.js"
import { FinalState, State } from "../states/State.js"
import { Module } from "./Module.js"

export interface Game<S extends State, E> extends Module<S, E> {
    gameResultOf(state: FinalState<S>): GameResult
}
