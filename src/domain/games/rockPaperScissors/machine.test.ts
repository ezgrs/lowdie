import { createActor } from "xstate"
import machine from "./machine"
import { RNG } from "../../services/rng"
import { RockPaperScissorsMove } from "../../models/rockPaperScissors"



const botCases: RockPaperScissorsMove[] = ["rock", "paper", "scissors"]
const playerCases: {
    move: RockPaperScissorsMove,
    text: string,
}[] = [
    {move: "rock", text: "Rock"},
    {move: "paper", text: "Paper"},
    {move: "scissors", text: "Scissors"},
]

describe.each(botCases)("when bot has chosen %s", (botMove) => {
    let actor: ReturnType<typeof createActor>
    let onInvalid: jest.Mock
    let rngChoose: jest.Mock

    beforeEach(() => {
        onInvalid = jest.fn()
        rngChoose = jest.fn()
        const rng: RNG = {choose: rngChoose}
        actor = createActor(machine, {
            input: {
                rng: rng,
                botMove: botMove,
            },
        })
        actor.start()
    })

    afterEach(() => {
        actor.stop()
        jest.clearAllMocks()
    })

    describe("when player is choosing a move", () => {
        test.each(playerCases)(
            "should accept $text as $move",
            ({move: userMove, text: userText}) => {
                actor.send({type: "ANSWER", value: userText})

                const snapshot = actor.getSnapshot()
                expect(snapshot.value).toBe("askForRetry")
                expect(snapshot.context).toStrictEqual({
                    botMove: botMove,
                    userMove: userMove,
                    rng: expect.any(Object),
                })
                expect(onInvalid).not.toHaveBeenCalled()
            },
        )
        test("should reject invalid input", () => {
            actor.send({type: "ANSWER", value: "..."})

            const snapshot = actor.getSnapshot()
            expect(snapshot.value).toBe("waitingForUser")
            expect(snapshot.context).toStrictEqual({
                botMove: botMove,
                userMove: undefined,
                rng: expect.any(Object),
            })
        })
    })
    describe.each(playerCases)(
        "when player has chosen $move",
        ({move: userMove, text: userText}) => {
            let snapshot: any
            beforeEach(() => {
                actor.send({type: "ANSWER", value: userText})
            })
            test.each(botCases)(
                "should accept a restart with %s",
                (nextBotMove) => {
                     rngChoose.mockReturnValue(nextBotMove)
                    actor.send({type: "ANSWER", value: "Yes"})
                    snapshot = actor.getSnapshot()

                    expect(snapshot.value).toBe("waitingForUser")
                    expect(snapshot.context).toStrictEqual({
                        botMove: nextBotMove,
                        userMove: undefined,
                        rng: expect.any(Object),
                    })
                },
            )
            test("should accept a cancel", () => {
                let snapshot: any

                actor.send({type: "ANSWER", value: "No"})
                snapshot = actor.getSnapshot()

                expect(snapshot.value).toBe("done")
                expect(snapshot.context).toStrictEqual({
                    botMove: botMove,
                    userMove: userMove,
                    rng: expect.any(Object),
                })
                expect(onInvalid).not.toHaveBeenCalled()
            })
        },
    )
})




