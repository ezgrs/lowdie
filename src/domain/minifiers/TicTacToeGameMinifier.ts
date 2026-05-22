import { TicTacToeGameEvent } from "../events/TicTacToeGameEvent.js"
import { TicTacToeGameState } from "../states/TicTacToeGameState.js"
import { Minifier } from "./Minifier.js"

type MinifiedTicTacToeGameEvent =
    | "s.s" // userStartedPropertySetup > playerSymbol
    | "s.d" // userStartedPropertySetup > difficulty
    | "s.." // userCanceledPropertySetup
    | "s.d.e" // userUpdatedProperty > difficulty > easy
    | "s.d.n" // userUpdatedProperty > difficulty > normal
    | "s.d.h" // userUpdatedProperty > difficulty > hard
    | "s.s.o" // userUpdatedProperty > playerSymbol > O
    | "s.s.x" // userUpdatedProperty > playerSymbol > X
    | "g.s" // userStartedGame
    | {
          type: "userMarkedSymbol"
          row: number
          col: number
      } // userMarkedSymbol

export class TicTacToeGameMinifier implements Minifier<
    TicTacToeGameState,
    TicTacToeGameEvent,
    MinifiedTicTacToeGameEvent
> {
    encode(
        _: TicTacToeGameState,
        event: TicTacToeGameEvent,
    ): MinifiedTicTacToeGameEvent {
        switch (event.type) {
            case "userStartedPropertySetup":
                switch (event.property) {
                    case "playerSymbol":
                        return "s.s"
                    case "difficulty":
                        return "s.d"
                }
            case "userCanceledPropertySetup":
                return "s.."
            case "userUpdatedProperty":
                switch (event.property) {
                    case "difficulty":
                        switch (event.value) {
                            case "easy":
                                return "s.d.e"
                            case "normal":
                                return "s.d.n"
                            case "hard":
                                return "s.d.h"
                        }
                    case "playerSymbol":
                        switch (event.value) {
                            case "O":
                                return "s.s.o"
                            case "X":
                                return "s.s.x"
                        }
                }
            case "userStartedGame":
                return "g.s"
            case "userMarkedSymbol":
                return event
        }
    }

    decode(
        _: TicTacToeGameState,
        value: MinifiedTicTacToeGameEvent,
    ): TicTacToeGameEvent {
        switch (value) {
            case "s.s":
                return {
                    type: "userStartedPropertySetup",
                    property: "playerSymbol",
                }
            case "s.d":
                return {
                    type: "userStartedPropertySetup",
                    property: "difficulty",
                }
            case "s..":
                return { type: "userCanceledPropertySetup" }
            case "s.d.e":
                return {
                    type: "userUpdatedProperty",
                    property: "difficulty",
                    value: "easy",
                }
            case "s.d.n":
                return {
                    type: "userUpdatedProperty",
                    property: "difficulty",
                    value: "normal",
                }
            case "s.d.h":
                return {
                    type: "userUpdatedProperty",
                    property: "difficulty",
                    value: "hard",
                }
            case "s.s.o":
                return {
                    type: "userUpdatedProperty",
                    property: "playerSymbol",
                    value: "O",
                }
            case "s.s.x":
                return {
                    type: "userUpdatedProperty",
                    property: "playerSymbol",
                    value: "X",
                }
            case "g.s":
                return { type: "userStartedGame" }
        }
        return value
    }
}
