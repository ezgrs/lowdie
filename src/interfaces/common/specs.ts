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
import { RetryModuleMinifier } from "@/domain/minifiers/RetryModuleMinifier.js"
import { RockPaperScissorsGameMinifier } from "@/domain/minifiers/RockPaperScissorsGameMinifier.js"
import { TicTacToeGameMinifier } from "@/domain/minifiers/TicTacToeGameMinifier.js"
import { BotMinifier } from "@/domain/minifiers/BotMinifier.js"
import { MinifiedModule } from "@/domain/modules/MinifiedModule.js"
import { Minifier } from "@/domain/minifiers/Minifier.js"

type Args<B extends boolean> = {
    randomizer: Randomizer
    ticTacToeBoardPresenter: TicTacToeBoardPresenter
    minified: B
}

type Spec<S extends State, E extends Event, ME> = ModuleSpec<S, E> & {
    minifier: Minifier<S, E, ME>
}

export function createBotSpec(
    args: Args<false>,
): ModuleSpec<BotState, BotEvent<Event>>
export function createBotSpec(args: Args<true>): ModuleSpec<BotState, any>
export function createBotSpec<B extends boolean>(
    args: Args<B>,
): ModuleSpec<BotState, any> {
    const spec = botSpecOf(args.randomizer, args.ticTacToeBoardPresenter)
    if (args.minified) {
        return {
            module: new MinifiedModule({
                module: spec.module,
                minifier: spec.minifier,
            }),
            renderer: spec.renderer,
        }
    }
    return spec
}

function botSpecOf(
    randomizer: Randomizer,
    ticTacToeBoardPresenter: TicTacToeBoardPresenter,
): Spec<BotState, BotEvent<Event>, any> {
    const specs: Spec<State, Event, any>[] = [
        {
            module: new RetryModule(new RockPaperScissorsGame({ randomizer })),
            renderer: new RetryModuleRenderer(
                new RockPaperScissorsGameRenderer(),
            ),
            minifier: new RetryModuleMinifier(
                new RockPaperScissorsGameMinifier(),
            ),
        },
        {
            module: new RetryModule(new TicTacToeGame({ randomizer })),
            renderer: new RetryModuleRenderer(
                new TicTacToeGameRenderer({
                    boardPresenter: ticTacToeBoardPresenter,
                }),
            ),
            minifier: new TicTacToeGameMinifier(),
        },
    ]
    return {
        module: new BotModule(specs.map((spec) => spec.module)),
        renderer: new BotRenderer(specs.map((spec) => spec.renderer)),
        minifier: new BotMinifier(specs.map((spec) => spec.minifier)),
    }
}
