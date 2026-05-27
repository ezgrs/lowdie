import { APIGatewayProxyHandlerV2 } from "aws-lambda"
import { StatusCodes } from "http-status-codes"
import { telegrafOf } from "@/interfaces/telegram/telegraf.js"
import { botSpecOf } from "@/interfaces/common/specs.js"
import { PseudoRandomizer } from "@/infrastructure/services/randomizers/pseudo.js"
import { TicTacToeAsciiBoardPresenter } from "@/interfaces/common/TicTacToeBoardPresenter.js"
import { DynamoDBChatDatabase } from "../../../infrastructure/services/consumers/dynamodb.js"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { BotState } from "@/domain/states/BotState.js"
import { TransmittingConsumer } from "@/application/use-cases/consumers/TransmittingConsumer.js"
import { TelegramTransmitter } from "@/infrastructure/services/transmitters/telegram.js"

const spec = botSpecOf(
    new PseudoRandomizer(),
    new TicTacToeAsciiBoardPresenter(),
)

const telegraf = telegrafOf({
    token: process.env["TELEGRAM_BOT_TOKEN"]!,
    module: spec.module,
    onConsumer: (telegram, chatId) =>
        new TransmittingConsumer({
            spec: spec,
            consumer: new DynamoDBChatDatabase<BotState>({
                chatId: chatId,
                client: new DynamoDBClient(),
            }),
            transmitter: new TelegramTransmitter(telegram, chatId),
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
