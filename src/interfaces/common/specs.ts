import { Randomizer } from "@/application/ports/Randomizer.js"
import { BotEvent } from "@/domain/events/BotEvent.js"
import { BotModule } from "@/domain/modules/BotModule.js"
import { RetryModule } from "@/domain/modules/RetryModule.js"
import { RockPaperScissorsGame } from "@/application/use-cases/games/RockPaperScissorsGame.js"
import { TicTacToeGame } from "@/application/use-cases/games/TicTacToeGame.js"
import { BotState } from "@/domain/states/BotState.js"
import { State } from "@/domain/states/State.js"
import { Event } from "@/domain/events/Event.js"
import { BotRenderer } from "../renderers/bot.js"
import { RetryModuleRenderer } from "../renderers/retry.js"
import { RockPaperScissorsGameRenderer } from "../renderers/rock-paper-scissors.js"
import { TicTacToeGameRenderer } from "../renderers/tic-tac-toe.js"
import { TicTacToeBoardPresenter } from "./TicTacToeBoardPresenter.js"
import { ModuleSpec } from "@/application/ports/ModuleSpec.js"

export function botSpecOf(
    randomizer: Randomizer,
    ticTacToeBoardPresenter: TicTacToeBoardPresenter,
): ModuleSpec<BotState, BotEvent<Event>> {
    const specs: ModuleSpec<State, Event>[] = [
        {
            module: new RetryModule(new RockPaperScissorsGame({ randomizer })),
            renderer: new RetryModuleRenderer(
                new RockPaperScissorsGameRenderer(),
            ),
        },
        {
            module: new RetryModule(new TicTacToeGame({ randomizer })),
            renderer: new RetryModuleRenderer(
                new TicTacToeGameRenderer({
                    boardPresenter: ticTacToeBoardPresenter,
                }),
            ),
        },
    ]
    return {
        module: new BotModule(specs.map((spec) => spec.module)),
        renderer: new BotRenderer(specs.map((spec) => spec.renderer)),
    }
}
