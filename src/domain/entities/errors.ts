export class UnexpectedModuleFlow extends Error {
    constructor(event: string, state: string)
    constructor(event: string, state: string, description: string)
    constructor(
        event: string,
        state: string,
        description?: string | undefined,
    ) {
        let message = `never expected event ${event} to be called within state ${state}`
        if (description != null) {
            message = `${message} (${description})`
        }
        super(message)
        this.name = "UnexpectedState"
    }
}
