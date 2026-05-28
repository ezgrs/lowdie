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
import { MinifiedRenderer } from "@/application/use-cases/renderers/MinifiedRenderer.js"
import { RetryModuleState } from "@/domain/states/RetryModuleState.js"
import { RetryModuleEvent } from "@/domain/events/RetryModuleEvent.js"
import { Module } from "@/domain/modules/Module.js"
import { Renderer } from "@/application/ports/Renderer.js"
import { Game } from "@/domain/modules/Game.js"
import { BlackjackGame } from "@/application/use-cases/games/BlackjackGame.js"
import { BlackjackGameRenderer } from "../renderers/blackjack.js"
import { BlackjackGameMinifier } from "@/domain/minifiers/BlackjackGameMinifier.js"

type Args<B extends boolean> = {
    randomizer: Randomizer
    ticTacToeBoardPresenter: TicTacToeBoardPresenter
    minified: B
}

type Spec<M extends Module<S, E>, S extends State, E extends Event, ME> = {
    module: M
    renderer: Renderer<S, E>
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
            renderer: new MinifiedRenderer({
                renderer: spec.renderer,
                minifier: spec.minifier,
            }),
        }
    }
    return spec
}

function retrySpecOf<S extends State, E extends Event>(
    spec: Spec<Game<S, E>, S, E, any>,
): Spec<RetryModule<S, E>, RetryModuleState<S>, RetryModuleEvent<E>, any> {
    return {
        module: new RetryModule(spec.module),
        renderer: new RetryModuleRenderer(spec.renderer),
        minifier: new RetryModuleMinifier(spec.minifier),
    }
}

function botSpecOf(
    randomizer: Randomizer,
    ticTacToeBoardPresenter: TicTacToeBoardPresenter,
): Spec<BotModule, BotState, BotEvent<Event>, any> {
    const gameSpecs: Spec<Game<State, Event>, State, Event, any>[] = [
        {
            module: new RockPaperScissorsGame({ randomizer }),
            renderer: new RockPaperScissorsGameRenderer(),
            minifier: new RockPaperScissorsGameMinifier(),
        },
        {
            module: new TicTacToeGame({ randomizer }),
            renderer: new TicTacToeGameRenderer({
                boardPresenter: ticTacToeBoardPresenter,
            }),
            minifier: new TicTacToeGameMinifier(),
        },
        {
            module: new BlackjackGame({ randomizer }),
            renderer: new BlackjackGameRenderer(),
            minifier: new BlackjackGameMinifier(),
        },
    ]
    const specs = gameSpecs.map(retrySpecOf)
    return {
        module: new BotModule(specs.map((spec) => spec.module)),
        renderer: new BotRenderer(specs.map((spec) => spec.renderer)),
        minifier: new BotMinifier(specs.map((spec) => spec.minifier)),
    }
}
