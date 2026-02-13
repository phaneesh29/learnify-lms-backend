import * as z from "zod"
import { asyncHandler } from "../../utils/apiHandler.js"
import { AdminLoginSchema, AdminRegisterSchema, AdminChangePasswordSchema } from "../../models/adminSchema.model.js"
import db from "../../db/index.js"
import { comparePassword, hashedPassword } from "../../utils/hashPassword.js"
import { generateToken } from "../../utils/genrateToken.js"
import { COOKIE_OPTIONS } from "../../constants.js"

export const adminLoginController = asyncHandler(async (req, res) => {
    const body = AdminLoginSchema.safeParse(req.body)
    if (!body.success) {
        const error = new Error(z.prettifyError(body.error))
        error.statusCode = 400
        throw error
    }
    const { email, password } = body.data
    const adminUser = db.prepare("SELECT id, email, password_hash, role FROM users WHERE email = ? AND role = 'admin'").get(email)
    if (!adminUser) {
        const error = new Error("Invalid email or password")
        error.statusCode = 401
        throw error
    }
    if (adminUser.role !== "admin") {
        const error = new Error("You are not authorized to access this resource")
        error.statusCode = 401
        throw error
    }
    const isPasswordValid = await comparePassword(password, adminUser.password_hash)
    if (!isPasswordValid) {
        const error = new Error("Invalid email or password")
        error.statusCode = 401
        throw error
    }
    const adminToken = generateToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role })


    res.status(200).cookie("adminToken", adminToken, COOKIE_OPTIONS).json({
        status: "success",
        message: "Admin logged in successfully",
        data: {
            adminToken,
        },
    })
})

export const adminRegisterController = asyncHandler(async (req, res) => {
    const body = AdminRegisterSchema.safeParse(req.body)
    if (!body.success) {
        const error = new Error(z.prettifyError(body.error))
        error.statusCode = 400
        throw error
    }
    const { email, first_name, last_name, password, phone_number } = body.data
    const passwordHash = await hashedPassword(password)
    let result;
    try {
        result = db.prepare("INSERT INTO users (first_name, last_name, email, password_hash, phone_number, role) VALUES (?, ?, ?, ?, ?, 'admin')").run(first_name, last_name, email, passwordHash, phone_number)
    } catch (e) {
        if (e.code === "SQLITE_CONSTRAINT_UNIQUE") {
            let message = "Duplicate value";

            if (e.message.includes("users.email")) {
                message = "Admin with this email already exists";
            }

            if (e.message.includes("users.phone_number")) {
                message = "Admin with this phone number already exists";
            }

            const err = new Error(message);
            err.statusCode = 409;
            throw err;
        }

        throw e;
    }
    if (!result || !result.changes) {
        const error = new Error("Failed to register admin")
        error.statusCode = 500
        throw error
    }

    res.status(201).json({
        status: "success",
        message: "Admin registered successfully",
    })
})

export const adminProfileController = asyncHandler(async (req, res) => {
    const { id, email, role } = req.admin;
    const adminUser = db.prepare("SELECT id, first_name, last_name, email, phone_number, role, created_at, updated_at FROM users WHERE id = ? AND role = 'admin'").get(id);
    if (!adminUser) {
        const error = new Error("Admin user not found");
        error.statusCode = 404;
        throw error;
    }
    res.status(200).json({
        status: "success",
        data: {
            admin: adminUser,
        }
    });
})

export const adminLogoutController = asyncHandler(async (req, res) => {
    res.status(200).clearCookie("adminToken", COOKIE_OPTIONS).json({
        status: "success",
        message: "Admin logged out successfully",
    })
})

export const adminChangePasswordController = asyncHandler(async (req, res) => {
    const body = AdminChangePasswordSchema.safeParse(req.body)
    if (!body.success) {
        const error = new Error(z.prettifyError(body.error))
        error.statusCode = 400
        throw error
    }
    const { old_password, new_password } = body.data
    const { id } = req.admin
    const adminUser = db.prepare("SELECT id, password_hash FROM users WHERE id = ? AND role = 'admin'").get(id)
    if (!adminUser) {
        const error = new Error("Admin user not found")
        error.statusCode = 404
        throw error
    }
    const isPasswordValid = await comparePassword(old_password, adminUser.password_hash)
    if (!isPasswordValid) {
        const error = new Error("Old password is incorrect")
        error.statusCode = 401
        throw error
    }
    const passwordHash = await hashedPassword(new_password)
    db.prepare("UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(passwordHash, id)
    res.status(200).json({
        status: "success",
        message: "Password changed successfully",
    })
})