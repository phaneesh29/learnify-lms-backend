import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../constants.js";
import { asyncHandler } from "../utils/apiHandler.js";

export const instructorAuthMiddleware = asyncHandler((req, res, next) => {
    const instructorToken = req.cookies.instructorToken || req.headers.authorization?.split(" ")[1];
    if (!instructorToken) {
        const error = new Error("Unauthorized: Instructor token is missing");
        error.statusCode = 401;
        throw error;
    }
    try {
        const payload = jwt.verify(instructorToken, JWT_SECRET);

        if (payload.role !== "instructor") {
            const err = new Error("Forbidden");
            err.statusCode = 403;
            throw err;
        }

        req.instructor = payload;

    } catch (error) {
        console.log(error);

        const err = new Error("Invalid or expired token");
        err.statusCode = 401;
        throw err;
    }
    next();
})
