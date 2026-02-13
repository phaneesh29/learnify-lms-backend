import * as z from "zod";

export const AdminLoginSchema = z.object({
  email: z.email().trim().describe("Admin email address"),
  password: z.string().trim().min(8, "Password must be at least 8 characters").max(32, "Password must be at most 32 characters").describe("Admin password")
});

export const AdminRegisterSchema = z.object({
  first_name: z.string().trim().min(1, "First name cannot be empty").describe("Admin first name"),
  last_name: z.string().trim().min(1, "Last name cannot be empty").describe("Admin last name"),
  email: z.email().trim().toLowerCase().describe("Admin email address"),
  password: z.string().trim().min(8, "Password must be at least 8 characters").max(32, "Password must be at most 32 characters").describe("Admin password"),
  phone_number: z.string().trim().min(10, "Phone number must be at least 10 digits").max(15, "Phone number must be at most 15 digits").describe("Admin phone number")
});

export const AdminChangePasswordSchema = z.object({
  old_password: z.string().trim().min(8, "Old password must be at least 8 characters").max(32, "Old password must be at most 32 characters").describe("Current password"),
  new_password: z.string().trim().min(8, "New password must be at least 8 characters").max(32, "New password must be at most 32 characters").describe("New password")
});