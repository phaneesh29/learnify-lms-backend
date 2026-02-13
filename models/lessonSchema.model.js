import * as z from "zod";

export const LessonSchema = z.object({
    title: z.string().trim().min(1, "Title cannot be empty").describe("Lesson title"),
    content_type: z.enum(["video", "article", "quiz"]).describe("Lesson content type"),
    content_url: z.string().trim().url("Invalid URL").optional().describe("Lesson content URL"),
    duration_minutes: z.number().int().positive("Duration must be a positive number").optional().describe("Lesson duration in minutes"),
    is_preview: z.boolean().default(false).describe("Whether lesson is available as preview"),
    position: z.number().int().positive("Position must be a positive number").describe("Lesson position in section"),
});
