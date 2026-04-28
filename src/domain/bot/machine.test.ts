import { createActor } from "xstate";
import machine from "./machine";
import { RNG } from "../services/rng";

let actor: ReturnType<typeof createActor>;
let rngChoose: jest.Mock;

beforeEach(() => {
  rngChoose = jest.fn();
  const rng: RNG = {choose: rngChoose};
  rngChoose.mockReturnValue("rock");
  actor = createActor(machine, {
    input: {
      rng: rng,
    }
  });
  actor.start();
});

afterEach(() => {
  actor.stop();
  jest.clearAllMocks();
})

test("goes to rock-paper-scissors", () => {
  actor.send({type: "ANSWER", value: "Rock-paper-scissors"});

  expect(actor.getSnapshot().value).toBe("rockPaperScissors");
});

test("goes to invalid", () => {
  actor.send({type: "ANSWER", value: "XXX"});
  
  expect(actor.getSnapshot().value).toBe("menu");
});

test("goes to rock-paper-scissors and play and return", () => {
  actor.send({type: "ANSWER", value: "Rock-paper-scissors"});

  expect(actor.getSnapshot().value).toBe("rockPaperScissors");

  actor.send({type: "ANSWER", value: "Paper"});
  expect(actor.getSnapshot().value).toBe("rockPaperScissors");

  actor.send({type: "ANSWER", value: "No"});
  expect(actor.getSnapshot().value).toBe("menu");
});