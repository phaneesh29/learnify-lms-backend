import * as z from "zod";

export const CourseSectionSchema = z.object({
    title: z.string().trim().min(1, "Title cannot be empty").describe("Section title"),
    position: z.number().int().positive("Position must be a positive number").describe("Section position"),
});
