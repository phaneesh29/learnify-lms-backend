import * as z from "zod";

export const InstructorRegisterSchema = z.object({
    first_name: z.string().trim().min(1, "First name cannot be empty").describe("Instructor first name"),
    last_name: z.string().trim().min(1, "Last name cannot be empty").describe("Instructor last name"),
    email: z.email().trim().toLowerCase().describe("Instructor email address"),
    password: z.string().trim().min(8, "Password must be at least 8 characters").max(32, "Password must be at most 32 characters").describe("Instructor password"),
    phone_number: z.string().trim().min(10, "Phone number must be at least 10 digits").max(15, "Phone number must be at most 15 digits").describe("Instructor phone number")
});

export const InstructorLoginSchema = z.object({
    email: z.email().trim().toLowerCase().describe("Instructor email address"),
    password: z.string().trim().min(8, "Password must be at least 8 characters").max(32, "Password must be at most 32 characters").describe("Instructor password")
});

export const InstructorForgotPasswordSchema = z.object({
    email: z.email().trim().toLowerCase().describe("Instructor email address")
});

export const InstructorResetPasswordSchema = z.object({
    token: z.string().trim().min(1, "Token is required").describe("Password reset token"),
    password: z.string().trim().min(8, "Password must be at least 8 characters").max(32, "Password must be at most 32 characters").describe("New password")
});

export const InstructorUpdateProfileSchema = z.object({
    first_name: z.string().trim().min(1, "First name cannot be empty").describe("Instructor first name").optional(),
    last_name: z.string().trim().min(1, "Last name cannot be empty").describe("Instructor last name").optional(),
    phone_number: z.string().trim().min(10, "Phone number must be at least 10 digits").max(15, "Phone number must be at most 15 digits").describe("Instructor phone number").optional()
});