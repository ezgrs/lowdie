import { TicTacToeMatrix } from "@/domain/entities/TicTacToe.js"

export interface TicTacToeBoardPresenter {
    present(matrix: TicTacToeMatrix): string
}

export class TicTacToePrettyBoardPresenter implements TicTacToeBoardPresenter {
    present(matrix: TicTacToeMatrix): string {
        const xLabels = ["1", "2", "3"]
        const yLabels = ["A", "B", "C"]

        const text = []
        for (let i = 0; i < 3; i++) {
            if (i === 0) {
                text.push("╔══━╋━━━╋━━━╋━━━╋━")
            } else {
                text.push("╠══━╋━━━╋━━━╋━━━╋━")
            }

            let line = "║ "
            line += `${yLabels[i]} ┃ `
            for (let j = 0; j < 3; j++) {
                const value = matrix[i]![j] === null ? " " : matrix[i]![j]
                line += `${value} ┃ `
            }
            text.push(line)
        }
        text.push("╚══━╋━━━╋━━━╋━━━╋━")

        let line = "    ║ "
        for (let i = 0; i < 3; i++) {
            line += `${xLabels[i]} ║ `
        }
        text.push(line)

        text.push("    ╚═══╩═══╩═══╝")
        return text.join("\n")
    }
}

export class TicTacToeAsciiBoardPresenter implements TicTacToeBoardPresenter {
    present(matrix: TicTacToeMatrix): string {
        const xLabels = ["1", "2", "3"]
        const yLabels = ["A", "B", "C"]

        const text = []
        for (let i = 0; i < 3; i++) {
            if (i > 0) {
                text.push("+---+---+---+---")
            }

            let line = "| "
            line += `${yLabels[i]} | `
            for (let j = 0; j < 3; j++) {
                const value = matrix[i]![j] === null ? " " : matrix[i]![j]
                if (j < 2) {
                    line += `${value} | `
                } else {
                    line += `${value}`
                }
            }
            text.push(line)
        }
        text.push("+---+---+---+---+")

        let line = "    | "
        for (let i = 0; i < 3; i++) {
            line += `${xLabels[i]} | `
        }
        text.push(line)

        text.push("    +---+---+---+")
        return text.join("\n")
    }
}
