import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ORIGIN } from './constants.js';
import { globalLimiter } from './middlewares/rateLimiter.middleware.js';

import healthRouter from './routes/health.routes.js';
import adminAuthRouter from './routes/auth/admin.auth.routes.js'
import studentAuthRouter from './routes/auth/student.auth.routes.js'
import instructorAuthRouter from './routes/auth/instructor.auth.routes.js'

import adminRouter from './routes/admin.routes.js';
import instructorRouter from './routes/instructor.routes.js';
import courseRouter from './routes/course.routes.js';

import { errorHandler } from './utils/errorHandler.js';

const app = express();

app.set("trust proxy", true);
app.disable("x-powered-by");

app.use(globalLimiter)

app.use(cors({
    origin: [ORIGIN,"http://127.0.0.1:5500"],
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, _, next) => {
    const ip = req.headers["cf-connecting-ip"] || req.headers["x-forwarded-for"]?.split(",")[0] || req.ip;
    console.info(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${ip} UA="${req.headers["user-agent"]}"`);
    next();
});

app.use("/api/health", healthRouter)
app.use("/api/auth/admin", adminAuthRouter)
app.use("/api/auth/student", studentAuthRouter)
app.use("/api/auth/instructor", instructorAuthRouter)
app.use("/api/admin", adminRouter)
app.use("/api/instructor", instructorRouter)
app.use("/api/course", courseRouter)

app.use(errorHandler);

export default app;

