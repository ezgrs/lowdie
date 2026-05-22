import { Randomizer } from "@/application/ports/Randomizer.js"
import { ModuleSpec } from "@/application/use-cases/runner.js"
import { BotEvent } from "@/domain/events/BotEvent.js"
import { BotModule } from "@/domain/modules/BotModule.js"
import { RetryModule } from "@/domain/modules/RetryModule.js"
import { RockPaperScissorsGame } from "@/domain/modules/RockPaperScissorsGame.js"
import { TicTacToeGame } from "@/domain/modules/TicTacToeGame.js"
import { BotState } from "@/domain/states/BotState.js"
import { State } from "@/domain/states/State.js"
import { BotRenderer } from "../renderers/bot.js"
import { RetryModuleRenderer } from "../renderers/retry.js"
import { RockPaperScissorsGameRenderer } from "../renderers/rock-paper-scissors.js"
import { TicTacToeGameRenderer } from "../renderers/tic-tac-toe.js"
import { TicTacToeBoardPresenter } from "./TicTacToeBoardPresenter.js"

export function botSpecOf(
    randomizer: Randomizer,
    ticTacToeBoardPresenter: TicTacToeBoardPresenter,
): ModuleSpec<BotState, BotEvent<any>> {
    let specs: ModuleSpec<State, any>[] = [
        {
            module: new RockPaperScissorsGame({ randomizer }),
            renderer: new RockPaperScissorsGameRenderer(),
        },
        {
            module: new TicTacToeGame({ randomizer }),
            renderer: new TicTacToeGameRenderer({
                boardPresenter: ticTacToeBoardPresenter,
            }),
        },
    ]
    specs = specs.map((spec) => ({
        module: new RetryModule(spec.module),
        renderer: new RetryModuleRenderer(spec.renderer),
    }))
    return {
        module: new BotModule(specs.map((spec) => spec.module)),
        renderer: new BotRenderer(specs.map((spec) => spec.renderer)),
    }
}
