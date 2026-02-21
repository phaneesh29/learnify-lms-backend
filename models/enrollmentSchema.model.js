import * as z from "zod";

export const FreeEnrollSchema = z.object({
    course_id: z.number().int().positive("Course ID is required"),
    coupon_code: z.string().min(1, "Coupon code is required").max(50),
});
