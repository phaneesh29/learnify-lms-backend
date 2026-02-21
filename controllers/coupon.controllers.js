import { asyncHandler } from "../utils/apiHandler.js";
import db from "../db/index.js";
import * as z from "zod";
import { CouponSchema, ApplyCouponSchema } from "../models/couponSchema.model.js";


export const createCouponController = asyncHandler((req, res) => {
    const body = CouponSchema.safeParse(req.body);
    if (!body.success) {
        const error = new Error(z.prettifyError(body.error));
        error.statusCode = 400;
        throw error;
    }

    const {
        code, description, discount_percent, max_discount_amount,
        min_order_amount, max_uses, max_uses_per_user, course_id, valid_from, valid_until,
    } = body.data;


    if (course_id) {
        const course = db.prepare("SELECT id FROM courses WHERE id = ?").get(course_id);
        if (!course) {
            const err = new Error("Course not found");
            err.statusCode = 404;
            throw err;
        }
    }

    try {
        const result = db.prepare(
            `INSERT INTO coupons (code, description, discount_percent, max_discount_amount, min_order_amount, max_uses, max_uses_per_user, course_id, valid_from, valid_until, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
            code.toUpperCase(), description || null, discount_percent,
            max_discount_amount || null, min_order_amount, max_uses,
            max_uses_per_user, course_id || null,
            valid_from.toISOString(), valid_until.toISOString(), req.admin.id
        );

        res.status(201).json({
            success: true,
            message: "Coupon created successfully",
            data: { couponId: result.lastInsertRowid },
        });
    } catch (err) {
        if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
            err.message = "A coupon with this code already exists";
            err.statusCode = 409;
            throw err;
        }
        throw err;
    }
});

export const getAllCouponsController = asyncHandler((req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const offset = (page - 1) * limit;
    const isActive = req.query.is_active;

    let query = `SELECT c.*, 
        CASE WHEN c.course_id IS NOT NULL THEN co.title ELSE NULL END AS course_title
        FROM coupons c LEFT JOIN courses co ON c.course_id = co.id`;
    let countQuery = "SELECT COUNT(*) as total FROM coupons c";
    const params = [];
    const conditions = [];

    if (isActive !== undefined && isActive !== "") {
        conditions.push("c.is_active = ?");
        params.push(Number(isActive));
    }

    if (conditions.length > 0) {
        const where = " WHERE " + conditions.join(" AND ");
        query += where;
        countQuery += where;
    }

    query += " ORDER BY c.created_at DESC LIMIT ? OFFSET ?";

    const total = db.prepare(countQuery).get(...params).total;
    const coupons = db.prepare(query).all(...params, limit, offset);


    const now = new Date().toISOString();
    const enriched = coupons.map(c => ({
        ...c,
        is_expired: c.valid_until < now,
        is_fully_used: c.used_count >= c.max_uses,
    }));

    res.status(200).json({
        success: true,
        data: enriched,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
});


export const getCouponByIdController = asyncHandler((req, res) => {
    const couponId = Number(req.params.id);
    if (!Number.isInteger(couponId)) {
        const err = new Error("Invalid coupon ID");
        err.statusCode = 400;
        throw err;
    }

    const coupon = db.prepare(
        `SELECT c.*, CASE WHEN c.course_id IS NOT NULL THEN co.title ELSE NULL END AS course_title
         FROM coupons c LEFT JOIN courses co ON c.course_id = co.id WHERE c.id = ?`
    ).get(couponId);

    if (!coupon) {
        const err = new Error("Coupon not found");
        err.statusCode = 404;
        throw err;
    }

    const usage = db.prepare(
        `SELECT cu.id, cu.discount_applied, cu.used_at,
                u.first_name, u.last_name, u.email,
                p.amount, p.original_amount
         FROM coupon_usage cu
         JOIN users u ON cu.user_id = u.id
         JOIN payments p ON cu.payment_id = p.id
         WHERE cu.coupon_id = ?
         ORDER BY cu.used_at DESC`
    ).all(couponId);

    const now = new Date().toISOString();
    res.status(200).json({
        success: true,
        data: {
            ...coupon,
            is_expired: coupon.valid_until < now,
            is_fully_used: coupon.used_count >= coupon.max_uses,
            usage_history: usage,
        },
    });
});


export const toggleCouponStatusController = asyncHandler((req, res) => {
    const couponId = Number(req.params.id);
    if (!Number.isInteger(couponId)) {
        const err = new Error("Invalid coupon ID");
        err.statusCode = 400;
        throw err;
    }

    const result = db.prepare(
        "UPDATE coupons SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(couponId);

    if (result.changes === 0) {
        const err = new Error("Coupon not found");
        err.statusCode = 404;
        throw err;
    }

    res.status(200).json({ success: true, message: "Coupon status toggled successfully" });
});


export const deleteCouponController = asyncHandler((req, res) => {
    const couponId = Number(req.params.id);
    if (!Number.isInteger(couponId)) {
        const err = new Error("Invalid coupon ID");
        err.statusCode = 400;
        throw err;
    }

    const result = db.prepare("DELETE FROM coupons WHERE id = ?").run(couponId);
    if (result.changes === 0) {
        const err = new Error("Coupon not found");
        err.statusCode = 404;
        throw err;
    }

    res.status(200).json({ success: true, message: "Coupon deleted successfully" });
});


export const applyCouponController = asyncHandler((req, res) => {
    const body = ApplyCouponSchema.safeParse(req.body);
    if (!body.success) {
        const error = new Error(z.prettifyError(body.error));
        error.statusCode = 400;
        throw error;
    }

    const { code, course_id } = body.data;
    const userId = req.student?.id || req.admin?.id;

    if (!userId) {
        const err = new Error("You must be logged in to apply a coupon");
        err.statusCode = 401;
        throw err;
    }


    const coupon = db.prepare("SELECT * FROM coupons WHERE code = ? COLLATE NOCASE").get(code.toUpperCase());
    if (!coupon) {
        const err = new Error("Invalid coupon code");
        err.statusCode = 404;
        throw err;
    }


    if (!coupon.is_active) {
        const err = new Error("This coupon is no longer active");
        err.statusCode = 400;
        throw err;
    }

    const now = new Date().toISOString();
    if (now < coupon.valid_from) {
        const err = new Error("This coupon is not valid yet");
        err.statusCode = 400;
        throw err;
    }
    if (now > coupon.valid_until) {
        const err = new Error("This coupon has expired");
        err.statusCode = 400;
        throw err;
    }

    if (coupon.used_count >= coupon.max_uses) {
        const err = new Error("This coupon has reached its usage limit");
        err.statusCode = 400;
        throw err;
    }

    const userUsage = db.prepare(
        "SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ? AND user_id = ?"
    ).get(coupon.id, userId);
    if (userUsage.count >= coupon.max_uses_per_user) {
        const err = new Error("You have already used this coupon the maximum number of times");
        err.statusCode = 400;
        throw err;
    }

 
    if (coupon.course_id && coupon.course_id !== course_id) {
        const err = new Error("This coupon is not valid for the selected course");
        err.statusCode = 400;
        throw err;
    }

    const course = db.prepare("SELECT id, price, title FROM courses WHERE id = ? AND is_published = 1").get(course_id);
    if (!course) {
        const err = new Error("Course not found");
        err.statusCode = 404;
        throw err;
    }


    if (course.price < coupon.min_order_amount) {
        const err = new Error(`Minimum order amount for this coupon is ${coupon.min_order_amount}`);
        err.statusCode = 400;
        throw err;
    }


    let discount = Math.floor((course.price * coupon.discount_percent) / 100);


    if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
        discount = coupon.max_discount_amount;
    }

    const finalAmount = Math.max(0, course.price - discount);
    const requiresPayment = finalAmount > 0;

    res.status(200).json({
        success: true,
        message: requiresPayment
            ? "Coupon applied successfully"
            : "Coupon applied — course is free! No payment required",
        data: {
            coupon_code: coupon.code,
            discount_percent: coupon.discount_percent,
            discount_amount: discount,
            original_price: course.price,
            final_price: finalAmount,
            requires_payment: requiresPayment,
            course_title: course.title,
        },
    });
});
