import { ChatDatabase } from "@/application/ports/ChatDatabase.js"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"

import {
    DynamoDBDocumentClient,
    PutCommand,
    GetCommand,
} from "@aws-sdk/lib-dynamodb"

import { SuperJSON } from "superjson"

export class DynamoDBChatDatabase<T> implements ChatDatabase<T> {
    private readonly client: DynamoDBDocumentClient
    private readonly tableName: string = "Lowdie-Session"

    constructor(client: DynamoDBClient) {
        this.client = DynamoDBDocumentClient.from(client)
    }

    async set(chatId: number, value: T): Promise<void> {
        const serialized = SuperJSON.serialize(value)

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

    async get(chatId: number): Promise<T | undefined> {
        const res = await this.client.send(
            new GetCommand({
                TableName: this.tableName,
                Key: { TelegramChatId: chatId },
            }),
        )

        const state = res.Item?.["state"]
        if (state == null) return undefined
        const parsed = SuperJSON.deserialize(state)
        return parsed as T
    }
}
