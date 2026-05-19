import { APIGatewayProxyHandlerV2 } from "aws-lambda"
import { StatusCodes } from "http-status-codes"
import { telegrafOf } from "@/interfaces/telegram/telegraf.js"
import { botSpecOf } from "@/interfaces/common/runner.js"
import { PseudoRandomizer } from "@/infrastructure/services/randomizer/pseudo.js"
import { TicTacToeAsciiBoardPresenter } from "@/interfaces/common/TicTacToeBoardPresenter.js"
import { DynamoBotStateDatabase } from "./database.js"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { TelegramInteractionChannel } from "@/infrastructure/services/interaction-channel/telegram.js"
import { DatabaseBasedAgent } from "@/infrastructure/services/agent/database.js"

const [telegraf] = telegrafOf({
    token: process.env["TELEGRAM_BOT_TOKEN"]!,
    createAgent: (telegram) =>
        new DatabaseBasedAgent({
            onChannel: (chatId) =>
                new TelegramInteractionChannel(telegram, chatId),
            spec: botSpecOf(
                new PseudoRandomizer(),
                new TicTacToeAsciiBoardPresenter(),
            ),
            database: new DynamoBotStateDatabase(new DynamoDBClient()),
        }),
})

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
