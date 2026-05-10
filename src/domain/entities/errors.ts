export class UnexpectedModuleFlow extends Error {
    constructor(event: string, state: string)
    constructor(event: string, state: string, condition: string)
    constructor(event: string, state: string, condition?: string | undefined) {
        let message = `never expected event ${event} to be called within state ${state}`
        if (condition != null) {
            message = `${message} when ${condition}`
        }
        super(message)
        this.name = "UnexpectedModuleFlow"
    }
}

export class SessionTimeoutError extends Error {
    constructor() {
        super("session has timed out")
        this.name = "SessionTimeoutError"
    }
}

export class SessionReplacedError extends Error {
    constructor() {
        super("session has been replaced with another")
        this.name = "SessionReplacedError"
    }
}
