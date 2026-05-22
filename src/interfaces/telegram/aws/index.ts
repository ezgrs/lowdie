import { APIGatewayProxyHandlerV2 } from "aws-lambda"
import { StatusCodes } from "http-status-codes"
import { telegrafOf } from "@/interfaces/telegram/telegraf.js"
import { botSpecOf } from "@/interfaces/common/specs.js"
import { PseudoRandomizer } from "@/infrastructure/services/randomizers/pseudo.js"
import { TicTacToeAsciiBoardPresenter } from "@/interfaces/common/TicTacToeBoardPresenter.js"
import { DynamoDBChatDatabase } from "../../../infrastructure/services/chat-databases/dynamodb.js"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { TelegramChat } from "@/infrastructure/services/chats/telegram.js"
import { DatabaseInbox } from "@/application/use-cases/inboxes/DatabaseInbox.js"

const [telegraf] = telegrafOf({
    token: process.env["TELEGRAM_BOT_TOKEN"]!,
    createInbox: (telegram) =>
        new DatabaseInbox({
            onChat: (chatId) => new TelegramChat(telegram, chatId),
            spec: botSpecOf(
                new PseudoRandomizer(),
                new TicTacToeAsciiBoardPresenter(),
            ),
            database: new DynamoDBChatDatabase(new DynamoDBClient()),
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
