class HttpError extends Error {
    statusCode;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}
export class BadRequestError extends HttpError {
    constructor(message) {
        super(message, 400);
    }
}
export class UnauthorizedError extends HttpError {
    constructor(message = "Unauthorized") {
        super(message, 401);
    }
}
export class ForbiddenError extends HttpError {
    constructor(message = "Forbidden") {
        super(message, 403);
    }
}
export class NotFoundError extends HttpError {
    constructor(message = "Not Found") {
        super(message, 404);
    }
}
export function errorHandler(err, req, res, next) {
    console.log(err);
    if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ error: err.message });
    }
    res.status(500).json({ error: "Something went wrong on our end" });
}
