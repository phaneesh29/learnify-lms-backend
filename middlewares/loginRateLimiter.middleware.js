import rateLimit, { ipKeyGenerator } from "express-rate-limit";

export const loginLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 1,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many login attempts. Try again later.",
    },
    keyGenerator: (req) => {
        const ip =
            req.headers["cf-connecting-ip"] ||
            req.headers["x-forwarded-for"]?.split(",")[0] ||
            req.ip;

        return ipKeyGenerator(ip);
    },
});
