import { asyncHandler } from "../utils/apiHandler.js";
import db from "../db/index.js";
import * as z from "zod";
import { FreeEnrollSchema } from "../models/enrollmentSchema.model.js";


export const enrollFreeController = asyncHandler((req, res) => {
    const body = FreeEnrollSchema.safeParse(req.body);
    if (!body.success) {
        const error = new Error(z.prettifyError(body.error));
        error.statusCode = 400;
        throw error;
    }

    const { course_id, coupon_code } = body.data;
    const studentId = req.student.id;

    // Check course exists & is published
    const course = db.prepare("SELECT id, price, title FROM courses WHERE id = ? AND is_published = 1").get(course_id);
    if (!course) {
        const err = new Error("Course not found or not published");
        err.statusCode = 404;
        throw err;
    }

    // Check student not already enrolled
    const existing = db.prepare("SELECT id, status FROM enrollments WHERE course_id = ? AND student_id = ?").get(course_id, studentId);
    if (existing) {
        const err = new Error(existing.status === "enrolled" ? "You are already enrolled in this course" : `Enrollment is ${existing.status}`);
        err.statusCode = 409;
        throw err;
    }

    // Validate coupon
    const coupon = db.prepare("SELECT * FROM coupons WHERE code = ? COLLATE NOCASE").get(coupon_code.toUpperCase());
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
    ).get(coupon.id, studentId);
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

    if (course.price < coupon.min_order_amount) {
        const err = new Error(`Minimum order amount for this coupon is ₹${coupon.min_order_amount}`);
        err.statusCode = 400;
        throw err;
    }

    // Calculate discount
    let discount = Math.floor((course.price * coupon.discount_percent) / 100);
    if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
        discount = coupon.max_discount_amount;
    }

    const finalAmount = Math.max(0, course.price - discount);

    if (finalAmount > 0) {
        const err = new Error("This course is not free after applying the coupon. Payment gateway is not yet available.");
        err.statusCode = 400;
        throw err;
    }

    // All checks passed — run transaction
    const enroll = db.transaction(() => {
        // 1. Create enrollment
        const enrollResult = db.prepare(
            `INSERT INTO enrollments (course_id, student_id, status, enrolled_at) VALUES (?, ?, 'enrolled', CURRENT_TIMESTAMP)`
        ).run(course_id, studentId);

        const enrollmentId = enrollResult.lastInsertRowid;

        // 2. Create payment record
        const paymentResult = db.prepare(
            `INSERT INTO payments (enrollment_id, amount, original_amount, coupon_id, discount_applied, payment_status, created_at, completed_at)
             VALUES (?, ?, ?, ?, ?, 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
        ).run(enrollmentId, 0, course.price, coupon.id, discount);

        const paymentId = paymentResult.lastInsertRowid;

        // 3. Record coupon usage
        db.prepare(
            `INSERT INTO coupon_usage (coupon_id, user_id, payment_id, discount_applied, used_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`
        ).run(coupon.id, studentId, paymentId, discount);

        // 4. Increment coupon used_count
        db.prepare(
            "UPDATE coupons SET used_count = used_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).run(coupon.id);

        return enrollmentId;
    });

    const enrollmentId = enroll();

    res.status(201).json({
        success: true,
        message: "Successfully enrolled in the course for free!",
        data: {
            enrollment_id: enrollmentId,
            course_id: course.id,
            course_title: course.title,
            status: "enrolled",
            payment_status: "completed",
            amount_paid: 0,
            discount_applied: discount,
            coupon_code: coupon.code,
        },
    });
});


export const getMyCoursesController = asyncHandler((req, res) => {
    const studentId = req.student.id;

    const courses = db.prepare(
        `SELECT 
            e.id AS enrollment_id,
            e.status AS enrollment_status,
            e.enrolled_at,
            c.id AS course_id,
            c.title,
            c.description,
            c.intro_link,
            c.price,
            c.duration_hours,
            c.start_date,
            c.end_date,
            c.rating,
            p.amount AS amount_paid,
            p.original_amount,
            p.discount_applied,
            p.payment_status,
            COALESCE(
                (SELECT json_group_array(
                    json_object('id', i.id, 'first_name', i.first_name, 'last_name', i.last_name, 'email', i.email)
                )
                FROM course_instructors ci
                JOIN instructors i ON i.id = ci.instructor_id
                WHERE ci.course_id = c.id), '[]'
            ) AS instructors
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        LEFT JOIN payments p ON p.enrollment_id = e.id
        WHERE e.student_id = ? AND e.status IN ('enrolled', 'completed')
        ORDER BY e.enrolled_at DESC`
    ).all(studentId);

    // Parse instructors JSON
    const parsed = courses.map(c => ({
        ...c,
        instructors: JSON.parse(c.instructors),
    }));

    res.status(200).json({
        success: true,
        data: parsed,
    });
});


export const getEnrollmentStatusController = asyncHandler((req, res) => {
    const courseId = Number(req.params.courseId);
    if (!Number.isInteger(courseId)) {
        const err = new Error("Invalid course ID");
        err.statusCode = 400;
        throw err;
    }

    const studentId = req.student.id;

    const enrollment = db.prepare(
        `SELECT e.id, e.status, e.enrolled_at, p.payment_status, p.amount, p.discount_applied
         FROM enrollments e
         LEFT JOIN payments p ON p.enrollment_id = e.id
         WHERE e.course_id = ? AND e.student_id = ?`
    ).get(courseId, studentId);

    res.status(200).json({
        success: true,
        data: enrollment || null,
    });
});


export const getEnrolledCourseDetailController = asyncHandler((req, res) => {
    const courseId = Number(req.params.courseId);
    if (!Number.isInteger(courseId)) {
        const err = new Error("Invalid course ID");
        err.statusCode = 400;
        throw err;
    }

    const studentId = req.student.id;

    // Check enrollment
    const enrollment = db.prepare(
        "SELECT id, status FROM enrollments WHERE course_id = ? AND student_id = ? AND status IN ('enrolled', 'completed')"
    ).get(courseId, studentId);

    if (!enrollment) {
        const err = new Error("You are not enrolled in this course");
        err.statusCode = 403;
        throw err;
    }

    // Get full course details from the view
    const course = db.prepare("SELECT * FROM course_details WHERE id = ?").get(courseId);
    if (!course) {
        const err = new Error("Course not found");
        err.statusCode = 404;
        throw err;
    }

    // Parse JSON fields
    const parsed = {
        ...course,
        instructors: JSON.parse(course.instructors || "[]"),
        sections: JSON.parse(course.sections || "[]"),
        enrollment: {
            id: enrollment.id,
            status: enrollment.status,
        },
    };

    // Sort sections by position, and lessons within each section by position
    parsed.sections.sort((a, b) => a.position - b.position);
    parsed.sections.forEach(s => {
        if (s.lessons) s.lessons.sort((a, b) => a.position - b.position);
    });

    res.status(200).json({
        success: true,
        data: parsed,
    });
});
