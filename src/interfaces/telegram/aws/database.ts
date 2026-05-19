import { DynamoDBClient } from "@aws-sdk/client-dynamodb"

import {
    DynamoDBDocumentClient,
    PutCommand,
    GetCommand,
} from "@aws-sdk/lib-dynamodb"

import { SuperJSON } from "superjson"
import { BotState } from "@/application/use-cases/modules/bot/State.js"
import {
    BotEvent,
    isBotEvent,
    newBotEvent,
} from "@/application/use-cases/modules/bot/Event.js"
import {
    isRetryModuleEvent,
    newRetryModuleEvent,
    RetryModuleEvent,
} from "@/application/use-cases/modules/retry/Event.js"
import { Event } from "@/domain/entities/Event.js"
import { BotStateDatabase } from "@/infrastructure/services/agent/database.js"

export class DynamoBotStateDatabase implements BotStateDatabase {
    private readonly client: DynamoDBDocumentClient
    private readonly tableName: string = "Lowdie-Session"

    constructor(client: DynamoDBClient) {
        SuperJSON.registerCustom<BotEvent<Event>, string>(
            {
                isApplicable: isBotEvent,
                serialize: JSON.stringify,
                deserialize: (v) => newBotEvent(JSON.parse(v)),
            },
            "BotEvent",
        )
        SuperJSON.registerCustom<RetryModuleEvent<Event>, string>(
            {
                isApplicable: isRetryModuleEvent,
                serialize: JSON.stringify,
                deserialize: (v) => newRetryModuleEvent(JSON.parse(v)),
            },
            "RetryModuleEvent",
        )

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
