import { DynamoDBClient } from "@aws-sdk/client-dynamodb"

import {
    DynamoDBDocumentClient,
    PutCommand,
    GetCommand,
} from "@aws-sdk/lib-dynamodb"

import { SuperJSON } from "superjson"
import { BotStateDatabase } from "../../../infrastructure/services/interaction-channel/telegram/stateless-bot.js"
import { BotState } from "../../../application/use-cases/modules/bot/State.js"

export class DynamoBotStateDatabase implements BotStateDatabase {
    private readonly client: DynamoDBDocumentClient
    private readonly tableName: string = "lowdie-Session"

    constructor(client: DynamoDBClient) {
        this.client = DynamoDBDocumentClient.from(client)
    }

    async set(chatId: number, state: BotState): Promise<void> {
        const serialized = SuperJSON.serialize(state)

        await this.client.send(
            new PutCommand({
                TableName: this.tableName,
                Item: {
                    TelegramChatId: chatId,
                    state: serialized,
                },
            }),
        )
    }

    async get(chatId: number): Promise<BotState | undefined> {
        const res = await this.client.send(
            new GetCommand({
                TableName: this.tableName,
                Key: { TelegramChatId: chatId },
            }),
        )

        const state = res.Item?.["state"]
        if (state == null) return undefined
        const parsed = SuperJSON.deserialize(state)
        return parsed as BotState
    }
}
