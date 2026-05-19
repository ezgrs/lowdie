import { APIGatewayProxyHandlerV2 } from "aws-lambda"
import { StatusCodes } from "http-status-codes"
import { telegrafOf } from "@/src/interfaces/telegram/telegraf.js"
import { StatelessTelegramBot } from "@/src/infrastructure/services/interaction-channel/telegram/stateless-bot.js"
import { botSpecOf } from "@/src/interfaces/common/runner.js"
import { PseudoRandomizer } from "@/src/infrastructure/services/randomizer/pseudo.js"
import { TicTacToeAsciiBoardPresenter } from "@/src/interfaces/common/TicTacToeBoardPresenter.js"
import { DynamoBotStateDatabase } from "./database.js"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"

const bot = new StatelessTelegramBot({
    spec: botSpecOf(new PseudoRandomizer(), new TicTacToeAsciiBoardPresenter()),
    database: new DynamoBotStateDatabase(new DynamoDBClient()),
})

const telegraf = telegrafOf(process.env["TELEGRAM_BOT_TOKEN"]!, bot)

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    const body = event.body
    if (body == null) {
        return {
            statusCode: StatusCodes.BAD_REQUEST,
        }
    }
    const data = JSON.parse(body)
    try {
        await telegraf.handleUpdate(data)
    } catch (err) {
        console.error(err)
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        }
    }
    return {
        statusCode: StatusCodes.OK,
    }
}
