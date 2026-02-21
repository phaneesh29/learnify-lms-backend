import * as z from "zod";

export const FeedbackSchema = z.object({
    name: z.string().trim().min(1, "Name is required").max(100, "Name must be 100 characters or less"),
    email: z.string().trim().email("Invalid email address"),
    subject: z.string().trim().min(1, "Subject is required").max(200, "Subject must be 200 characters or less"),
    category: z.enum(
        ["general", "course_content", "platform_issue", "instructor", "suggestion", "complaint"],
        { message: "Invalid category" }
    ).default("general"),
    message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000, "Message must be 2000 characters or less"),
    rating: z.number().int().min(1, "Rating must be between 1 and 5").max(5, "Rating must be between 1 and 5").optional(),
});
