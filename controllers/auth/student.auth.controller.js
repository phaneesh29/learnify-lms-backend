import * as z from "zod";
import crypto from "crypto";
import db from "../../db/index.js"
import { StudentLoginSchema, StudentRegisterSchema, StudentForgotPasswordSchema, StudentResetPasswordSchema, StudentUpdateProfileSchema } from "../../models/studentSchema.model.js";
import { asyncHandler } from "../../utils/apiHandler.js";
import { sendVerifyEmail, sendPasswordResetEmail } from "../../utils/sendEmail.js";
import { comparePassword, hashedPassword } from "../../utils/hashPassword.js"
import { generateToken } from "../../utils/genrateToken.js"
import { COOKIE_OPTIONS } from "../../constants.js"
import { ResendSchema } from "../../models/resndEmailSchema.model.js";

export const studentRegisterController = asyncHandler(async (req, res) => {
    const body = StudentRegisterSchema.safeParse(req.body)
    if (!body.success) {
        const error = new Error(z.prettifyError(body.error))
        error.statusCode = 400
        throw error
    }
    const { email, first_name, last_name, password, phone_number } = body.data
    const passwordHash = await hashedPassword(password)
    let result;
    try {
        result = db.prepare("INSERT INTO users (first_name, last_name, email, password_hash, phone_number, role) VALUES (?, ?, ?, ?, ?, 'student')").run(first_name, last_name, email, passwordHash, phone_number)
    } catch (e) {
        if (e.code === "SQLITE_CONSTRAINT_UNIQUE") {
            let message = "Duplicate value";

            if (e.message.includes("users.email")) {
                message = "Student with this email already exists";
            }

            if (e.message.includes("users.phone_number")) {
                message = "Student with this phone number already exists";
            }

            const err = new Error(message);
            err.statusCode = 409;
            throw err;
        }

        throw e;
    }
    if (!result || !result.changes) {
        const error = new Error("Failed to register student")
        error.statusCode = 500
        throw error
    }

    try {
        await sendVerifyEmail({
            to: email
        });
    } catch (err) {
        console.error("Email sending failed:", err);
    }

    res.status(201).json({
        status: "success",
        message: "Student registered successfully",
    })
})

export const studentLoginController = asyncHandler(async (req, res) => {
    const body = StudentLoginSchema.safeParse(req.body)
    if (!body.success) {
        const error = new Error(z.prettifyError(body.error))
        error.statusCode = 400
        throw error
    }
    const { email, password } = body.data
    const studentUser = db.prepare("SELECT id, email, password_hash, role, email_verified FROM users WHERE email = ? AND role = 'student'").get(email)
    if (!studentUser) {
        const error = new Error("Invalid email or password")
        error.statusCode = 401
        throw error
    }
    if (studentUser.role !== "student") {
        const error = new Error("You are not authorized to access this resource")
        error.statusCode = 401
        throw error
    }
    if (!studentUser.email_verified) {
        const error = new Error("Email not verified. Please verify your email before logging in.")
        error.statusCode = 403
        throw error
    }
    const isPasswordValid = await comparePassword(password, studentUser.password_hash)
    if (!isPasswordValid) {
        const error = new Error("Invalid email or password")
        error.statusCode = 401
        throw error
    }
    const studentToken = generateToken({ id: studentUser.id, email: studentUser.email, role: studentUser.role })


    res.status(200).cookie("studentToken", studentToken, COOKIE_OPTIONS).json({
        status: "success",
        message: "Student logged in successfully",
        data: {
            studentToken,
        },
    })
})

export const studentResendVerifyEmailController = asyncHandler(async (req, res) => {
    const result = ResendSchema.safeParse(req.body);
    if (!result.success) {
        const error = new Error(z.prettifyError(result.error));
        error.statusCode = 400;
        throw error;
    }
    const { email } = result.data;
    const studentUser = db.prepare("SELECT id, email, email_verified FROM users WHERE email = ? AND role = 'student'").get(email);

    if (studentUser && !studentUser.email_verified) {
        try {
            await sendVerifyEmail({ to: email });
        } catch (err) {
            console.error("Resend verification email failed:", err);
        }
    }
    res.status(200).json({
        status: "success",
        message: "If an account exists, a verification email has been sent.",
    });

})

export const studentVerifyController = asyncHandler(async (req, res) => {
    const {token} = req.body;
    if (!token?.trim()) {
        const error = new Error("Verification token is required");
        error.statusCode = 400;
        throw error;
    }
    const hashedToken = crypto.createHash("sha256").update(token?.trim()).digest("hex");
    const user = db.prepare("SELECT id, email_verified FROM users WHERE verify_token = ? AND verify_expiry > ? AND role = 'student'").get(hashedToken, Date.now());
    if (!user) {
        const error = new Error("Invalid or expired verification token");
        error.statusCode = 400;
        throw error;
    }
    if(user.email_verified) {
        const error = new Error("Email is already verified");
        error.statusCode = 400;
        throw error;
    }
    db.prepare("UPDATE users SET email_verified = 1, verify_token = NULL, verify_expiry = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(user.id);
    res.status(200).json({
        status: "success",
        message: "Email verified successfully",
    });
})

export const studentProfileController = asyncHandler(async (req, res) => {
    const { id, email, role } = req.student;
    const studentUser = db.prepare("SELECT id, first_name, last_name, email, phone_number, role, created_at, updated_at FROM users WHERE id = ? AND role = 'student'").get(id);
    if (!studentUser) {
        const error = new Error("Student user not found");
        error.statusCode = 404;
        throw error;
    }
    res.status(200).json({
        status: "success",
        data: {
            student: studentUser,
        }
    });
})

export const studentLogoutController = asyncHandler(async (req, res) => {
    res.status(200).clearCookie("studentToken", COOKIE_OPTIONS).json({
        status: "success",
        message: "Student logged out successfully",
    })
})

export const studentForgotPasswordController = asyncHandler(async (req, res) => {
    const body = StudentForgotPasswordSchema.safeParse(req.body)
    if (!body.success) {
        const error = new Error(z.prettifyError(body.error))
        error.statusCode = 400
        throw error
    }
    const { email } = body.data
    const studentUser = db.prepare("SELECT id, email FROM users WHERE email = ? AND role = 'student'").get(email)

    if (studentUser) {
        try {
            await sendPasswordResetEmail({ to: email });
        } catch (err) {
            console.error("Password reset email failed:", err);
        }
    }
    res.status(200).json({
        status: "success",
        message: "If an account exists with this email, a password reset link has been sent.",
    })
})

export const studentResetPasswordController = asyncHandler(async (req, res) => {
    const body = StudentResetPasswordSchema.safeParse(req.body)
    if (!body.success) {
        const error = new Error(z.prettifyError(body.error))
        error.statusCode = 400
        throw error
    }
    const { token, password } = body.data
    const hashedToken = crypto.createHash("sha256").update(token.trim()).digest("hex")
    const user = db.prepare("SELECT id FROM users WHERE password_reset_token = ? AND password_reset_expiry > ? AND role = 'student'").get(hashedToken, Date.now())
    if (!user) {
        const error = new Error("Invalid or expired reset token")
        error.statusCode = 400
        throw error
    }
    const passwordHash = await hashedPassword(password)
    db.prepare("UPDATE users SET password_hash = ?, password_reset_token = NULL, password_reset_expiry = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(passwordHash, user.id)
    res.status(200).json({
        status: "success",
        message: "Password reset successfully",
    })
})

export const studentUpdateProfileController = asyncHandler(async (req, res) => {
    const body = StudentUpdateProfileSchema.safeParse(req.body)
    if (!body.success) {
        const error = new Error(z.prettifyError(body.error))
        error.statusCode = 400
        throw error
    }
    const { first_name, last_name, phone_number } = body.data
    if (!first_name && !last_name && !phone_number) {
        const error = new Error("At least one field is required to update")
        error.statusCode = 400
        throw error
    }
    const { id } = req.student
    const fields = []
    const values = []
    if (first_name) { fields.push("first_name = ?"); values.push(first_name) }
    if (last_name) { fields.push("last_name = ?"); values.push(last_name) }
    if (phone_number) { fields.push("phone_number = ?"); values.push(phone_number) }
    fields.push("updated_at = CURRENT_TIMESTAMP")
    values.push(id)
    try {
        const result = db.prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ? AND role = 'student'`).run(...values)
        if (result.changes === 0) {
            const error = new Error("Student not found")
            error.statusCode = 404
            throw error
        }
    } catch (e) {
        if (e.code === "SQLITE_CONSTRAINT_UNIQUE") {
            const err = new Error("Phone number already in use");
            err.statusCode = 409;
            throw err;
        }
        throw e;
    }
    res.status(200).json({
        status: "success",
        message: "Profile updated successfully",
    })
})