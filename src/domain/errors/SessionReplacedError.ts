export class SessionReplacedError extends Error {
    constructor() {
        super("session has been replaced with another")
        this.name = "SessionReplacedError"
    }
}
