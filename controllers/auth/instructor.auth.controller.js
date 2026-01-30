import * as z from "zod"
import crypto from "crypto"
import { InstructorLoginSchema, InstructorRegisterSchema } from "../../models/instructorSchema.model.js"
import { ResendSchema } from "../../models/resndEmailSchema.model.js"
import { asyncHandler } from "../../utils/apiHandler.js"
import { sendVerifyEmail } from "../../utils/sendEmail.js"
import db from "../../db/index.js"
import { comparePassword, hashedPassword } from "../../utils/hashPassword.js"
import { generateToken } from "../../utils/genrateToken.js"
import { COOKIE_OPTIONS } from "../../constants.js"

export const instructorRegisterController = asyncHandler(async (req, res) => {
    const body = InstructorRegisterSchema.safeParse(req.body)
    if (!body.success) {
        const error = new Error(z.prettifyError(body.error))
        error.statusCode = 400
        throw error
    }
    const { email, first_name, last_name, password, phone_number } = body.data
    const passwordHash = await hashedPassword(password)
    let result;
    try {
        const tx = db.transaction(() => {
            const r = db.prepare("INSERT INTO users (first_name, last_name, email, password_hash, phone_number, role) VALUES (?, ?, ?, ?, ?, 'instructor')").run(first_name, last_name, email, passwordHash, phone_number)
            db.prepare("INSERT INTO instructor_profile (user_id) VALUES (?)").run(r.lastInsertRowid)
            return r;
        })
        result = tx();
    } catch (e) {
        if (e.code === "SQLITE_CONSTRAINT_UNIQUE") {
            let message = "Duplicate value";

            if (e.message.includes("users.email")) {
                message = "Instructor with this email already exists";
            }

            if (e.message.includes("users.phone_number")) {
                message = "Instructor with this phone number already exists";
            }

            const err = new Error(message);
            err.statusCode = 409;
            throw err;
        }

        throw e;
    }
    if (!result || !result.changes) {
        const error = new Error("Failed to register instructor")
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
        message: "Instructor registered successfully",
    })
})

export const instructorLoginController = asyncHandler(async (req, res) => {
    const body = InstructorLoginSchema.safeParse(req.body)
    if (!body.success) {
        const error = new Error(z.prettifyError(body.error))
        error.statusCode = 400
        throw error
    }
    const { email, password } = body.data
    const instructorUser = db.prepare("SELECT id, email, password_hash, role, email_verified, admin_verified FROM instructors WHERE email = ? AND role = 'instructor'").get(email)
    if (!instructorUser) {
        const error = new Error("Invalid email or password")
        error.statusCode = 401
        throw error
    }
    if (instructorUser.role !== "instructor") {
        const error = new Error("You are not authorized to access this resource")
        error.statusCode = 401
        throw error
    }
    if (!instructorUser.admin_verified) {
        const error = new Error("You are not authorized by admin to access this resource")
        error.statusCode = 403
        throw error
    }
    if (!instructorUser.email_verified) {
        const error = new Error("Email not verified. Please verify your email before logging in.")
        error.statusCode = 403
        throw error
    }
    const isPasswordValid = await comparePassword(password, instructorUser.password_hash)
    if (!isPasswordValid) {
        const error = new Error("Invalid email or password")
        error.statusCode = 401
        throw error
    }
    const instructorToken = generateToken({ id: instructorUser.id, email: instructorUser.email, role: instructorUser.role })


    res.status(200).cookie("instructorToken", instructorToken, COOKIE_OPTIONS).json({
        status: "success",
        message: "Instructor logged in successfully",
        data: {
            instructorToken,
        },
    })
})

export const instructorResendVerifyEmailController = asyncHandler(async (req, res) => {
    const result = ResendSchema.safeParse(req.body);
    if (!result.success) {
        const error = new Error(z.prettifyError(result.error));
        error.statusCode = 400;
        throw error;
    }
    const { email } = result.data;
    const instructorUser = db.prepare("SELECT id, email, email_verified FROM instructors WHERE email = ? AND role = 'instructor'").get(email);

    if (instructorUser && !instructorUser.email_verified) {
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

export const instructorVerifyController = asyncHandler(async (req, res) => {
    const { token } = req.body;
    if (!token?.trim()) {
        const error = new Error("Verification token is required");
        error.statusCode = 400;
        throw error;
    }
    const hashedToken = crypto.createHash("sha256").update(token?.trim()).digest("hex");
    const user = db.prepare("SELECT id, email_verified FROM users WHERE verify_token = ? AND verify_expiry > ? AND role = 'instructor'").get(hashedToken, Date.now());
    if (!user) {
        const error = new Error("Invalid or expired verification token");
        error.statusCode = 400;
        throw error;
    }
    if (user.email_verified) {
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

export const instructorProfileController = asyncHandler(async (req, res) => {
    const { id } = req.instructor;
    const instructorUser = db.prepare("SELECT id, first_name, last_name, email, phone_number, skills ,role, created_at, updated_at FROM instructors WHERE id = ? AND role = 'instructor'").get(id);
    if (!instructorUser) {
        const error = new Error("Instructor user not found");
        error.statusCode = 404;
        throw error;
    }
    instructorUser.skills = JSON.parse(instructorUser.skills);
    res.status(200).json({
        status: "success",
        data: {
            instructor: instructorUser,
        }
    });
})

export const instructorLogoutController = asyncHandler(async (req, res) => {
    res.status(200).clearCookie("instructorToken", COOKIE_OPTIONS).json({
        status: "success",
        message: "Instructor logged out successfully",
    })
})