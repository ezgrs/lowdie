import { Consumer } from "@/application/ports/Consumer.js"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"

import {
    DynamoDBDocumentClient,
    PutCommand,
    GetCommand,
} from "@aws-sdk/lib-dynamodb"

import { SuperJSON } from "superjson"

type Args = {
    client: DynamoDBClient
    chatId: number
}

export class DynamoDBChatDatabase<T> implements Consumer<T> {
    private readonly client: DynamoDBDocumentClient
    private readonly chatId: number
    private readonly tableName: string = "Lowdie-Session"

    constructor(args: Args) {
        this.client = DynamoDBDocumentClient.from(args.client)
        this.chatId = args.chatId
    }

    async consume(value: T): Promise<void> {
        const serialized = SuperJSON.serialize(value)

        await this.client.send(
            new PutCommand({
                TableName: this.tableName,
                Item: {
                    TelegramChatId: this.chatId,
                    state: serialized,
                },
            }),
        )
    }

    async provide(): Promise<T> {
        const res = await this.client.send(
            new GetCommand({
                TableName: this.tableName,
                Key: { TelegramChatId: this.chatId },
            }),
        )

        const state = res.Item?.["state"]
        if (state == null) throw new Error()
        const parsed = SuperJSON.deserialize(state)
        return parsed as T
    }
}
