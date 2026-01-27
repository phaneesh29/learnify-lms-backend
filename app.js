import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ORIGIN } from './constants.js';

import healthRouter from './routes/health.routes.js';
import adminAuthRouter from './routes/auth/admin.auth.routes.js'
import { errorHandler } from './utils/errorHandler.js';

const app = express();

app.use(cors({
    origin:ORIGIN,
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/health",healthRouter)
app.use("/api/auth/admin",adminAuthRouter)

app.use(errorHandler);

export default app;

