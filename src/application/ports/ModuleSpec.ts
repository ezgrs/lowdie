import { State } from "@/domain/states/State.js"
import { Event } from "@/domain/events/Event.js"
import { Renderer } from "./Renderer.js"
import { Module } from "@/domain/modules/Module.js"
import { Minifier } from "@/domain/minifiers/Minifier.js"

export type ModuleSpec<S extends State, E extends Event> = {
    module: Module<S, E>
    renderer: Renderer<S, E>
    minifier: Minifier<S, E, any>
}
