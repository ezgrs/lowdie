import { Agent } from "@/application/ports/Agent.js"

type Session = {
    agent: Agent
    runner: Promise<void>
}

type Args = {
    onAgent: (chatId: number) => Agent
}

export class MemoryBasedAgent implements Agent {
    private readonly sessions: Map<number, Session> = new Map()
    private readonly onAgent: (chatId: number) => Agent

    constructor(args: Args) {
        this.onAgent = args.onAgent
    }

    async started(chatId: number): Promise<void> {
        const session = this.sessions.get(chatId)
        if (session != null) {
            session.agent.disposed("")
            this.sessions.delete(chatId)
        }
        const agent = this.onAgent(chatId)
        this.sessions.set(chatId, {
            agent: agent,
            runner: agent.started(chatId),
        })
    }

    async texted(chatId: number, text: string): Promise<void> {
        const session = this.sessions.get(chatId)
        if (session == null) return
        await session.agent.texted(chatId, text)
    }

    async answered(chatId: number, data: string): Promise<void> {
        const session = this.sessions.get(chatId)
        if (session == null) return
        await session.agent.answered(chatId, data)
    }

    async disposed(): Promise<void> {
        await Promise.allSettled(
            Array.from(this.sessions.values()).map(async (session) => {
                await session.runner
            }),
        )
    }
}
