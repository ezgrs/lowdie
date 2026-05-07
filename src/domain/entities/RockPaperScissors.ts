export const moves = ["rock", "paper", "scissors"] as const
export type Move = (typeof moves)[number]
