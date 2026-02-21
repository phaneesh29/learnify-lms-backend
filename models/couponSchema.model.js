import * as z from "zod";

export const CouponSchema = z.object({
    code: z.string().trim().min(3, "Code must be at least 3 characters").max(30, "Code must be 30 characters or less")
        .regex(/^[A-Za-z0-9_-]+$/, "Code can only contain letters, numbers, hyphens, and underscores"),
    description: z.string().trim().max(200, "Description must be 200 characters or less").optional(),
    discount_percent: z.number().int().min(1, "Discount must be at least 1%").max(100, "Discount cannot exceed 100%"),
    max_discount_amount: z.number().int().min(1, "Max discount amount must be positive").optional(),
    min_order_amount: z.number().int().min(0, "Min order amount cannot be negative").default(0),
    max_uses: z.number().int().min(1, "Max uses must be at least 1").default(1),
    max_uses_per_user: z.number().int().min(1, "Max uses per user must be at least 1").default(1),
    course_id: z.number().int().positive("Course ID must be positive").optional(),
    valid_from: z.coerce.date().default(() => new Date()),
    valid_until: z.coerce.date(),
}).refine((data) => data.valid_until > data.valid_from, {
    message: "valid_until must be after valid_from",
});

export const ApplyCouponSchema = z.object({
    code: z.string().trim().min(1, "Coupon code is required"),
    course_id: z.number().int().positive("Course ID must be positive"),
});
