import { asyncHandler } from "../utils/apiHandler.js";
import db from "../db/index.js";
import * as z from "zod";
import { FeedbackSchema } from "../models/feedbackSchema.model.js";

export const submitFeedbackController = asyncHandler((req, res) => {
    const body = FeedbackSchema.safeParse(req.body);
    if (!body.success) {
        const error = new Error(z.prettifyError(body.error));
        error.statusCode = 400;
        throw error;
    }

    const { name, email, subject, category, message, rating } = body.data;

    const result = db.prepare(
        "INSERT INTO feedback (name, email, subject, category, message, rating) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(name, email, subject, category, message, rating || null);

    res.status(201).json({
        success: true,
        message: "Thank you for your feedback!",
        data: { feedbackId: result.lastInsertRowid },
    });
});

export const getAllFeedbackController = asyncHandler((req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const offset = (page - 1) * limit;
    const category = req.query.category;
    const isRead = req.query.is_read;

    let query = "SELECT * FROM feedback";
    let countQuery = "SELECT COUNT(*) as total FROM feedback";
    const params = [];
    const conditions = [];

    if (category) {
        conditions.push("category = ?");
        params.push(category);
    }

    if (isRead !== undefined && isRead !== "") {
        conditions.push("is_read = ?");
        params.push(Number(isRead));
    }

    if (conditions.length > 0) {
        const where = " WHERE " + conditions.join(" AND ");
        query += where;
        countQuery += where;
    }

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";

    const total = db.prepare(countQuery).get(...params).total;
    const feedback = db.prepare(query).all(...params, limit, offset);

    res.status(200).json({
        success: true,
        data: feedback,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    });
});

export const getFeedbackByIdController = asyncHandler((req, res) => {
    const feedbackId = Number(req.params.id);
    if (!Number.isInteger(feedbackId)) {
        const err = new Error("Invalid feedback ID");
        err.statusCode = 400;
        throw err;
    }

    const feedback = db.prepare("SELECT * FROM feedback WHERE id = ?").get(feedbackId);
    if (!feedback) {
        const err = new Error("Feedback not found");
        err.statusCode = 404;
        throw err;
    }


    if (!feedback.is_read) {
        db.prepare("UPDATE feedback SET is_read = 1 WHERE id = ?").run(feedbackId);
        feedback.is_read = 1;
    }

    res.status(200).json({ success: true, data: feedback });
});

export const deleteFeedbackController = asyncHandler((req, res) => {
    const feedbackId = Number(req.params.id);
    if (!Number.isInteger(feedbackId)) {
        const err = new Error("Invalid feedback ID");
        err.statusCode = 400;
        throw err;
    }

    const result = db.prepare("DELETE FROM feedback WHERE id = ?").run(feedbackId);
    if (result.changes === 0) {
        const err = new Error("Feedback not found");
        err.statusCode = 404;
        throw err;
    }

    res.status(200).json({ success: true, message: "Feedback deleted successfully" });
});
