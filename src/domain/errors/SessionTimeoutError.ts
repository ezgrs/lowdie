export class SessionTimeoutError extends Error {
    constructor() {
        super("session has timed out")
        this.name = "SessionTimeoutError"
    }
}
