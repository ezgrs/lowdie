import { Renderer } from "@/application/ports/Renderer.js"
import { TicTacToeGameEvent } from "@/domain/events/TicTacToeGameEvent.js"
import { TicTacToeGameState } from "@/domain/states/TicTacToeGameState.js"
import { TicTacToeBoardPresenter } from "../common/TicTacToeBoardPresenter.js"

type Args = {
    boardPresenter: TicTacToeBoardPresenter
}

export class TicTacToeGameRenderer implements Renderer<
    TicTacToeGameState,
    TicTacToeGameEvent
> {
    private readonly boardPresenter: TicTacToeBoardPresenter

    constructor(args: Args) {
        this.boardPresenter = args.boardPresenter
    }

    choiceLabelOf(_: TicTacToeGameState, event: TicTacToeGameEvent): string {
        switch (event.type) {
            case "userStartedPropertySetup":
                switch (event.property) {
                    case "difficulty":
                        return "Alterar dificuldade"
                    case "playerSymbol":
                        return "Alterar minha peça"
                }
            case "userUpdatedProperty":
                switch (event.property) {
                    case "difficulty":
                        return {
                            easy: "Fácil",
                            normal: "Normal",
                            hard: "Difícil",
                        }[event.value]
                    case "playerSymbol":
                        return {
                            X: "X",
                            O: "O",
                        }[event.value]
                }
            case "userCanceledPropertySetup":
                return "Cancelar"
            case "userStartedGame":
                return "Começar o jogo"
            case "userMarkedSymbol":
                return ""
        }
    }

    messagesOf(state: TicTacToeGameState): string[] {
        switch (state.type) {
            case "settingUp":
                return [
                    "Dificuldade atual: " +
                        {
                            easy: "Fácil",
                            normal: "Normal",
                            hard: "Difícil",
                        }[state.difficulty] +
                        "\n" +
                        "Sua peça: " +
                        {
                            X: "X",
                            O: "O",
                        }[state.playerSymbol],
                ]
            case "playing":
                return [
                    this.boardPresenter.present(state.board.matrix),
                    "Em qual posição você deseja marcar?",
                ]
            case "done":
                return [""]
        }
    }
}
