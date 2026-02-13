import * as z from "zod";

export const CourseSchema = z.object({
    title: z.string().trim().min(1, "Title cannot be empty").describe("Course title"),
    description: z.string().trim().min(1, "Description cannot be empty").describe("Course description"),
    intro_link: z.string().trim().url("Invalid intro link URL").optional().describe("Course intro video link"),
    price: z.number().int().min(0, "Price must be >= 0").describe("Course price in INR"),
    duration_hours: z.number().int().positive("Duration must be a positive number").describe("Course duration in hours"),
    start_date: z.coerce.date().describe("Course start date"),
    end_date: z.coerce.date().describe("Course end date"),
}).refine((data) => data.end_date > data.start_date, {
    message: "End date must be after start date",
});

export const CourseSearchSchema = z.object({
    query: z.string().trim().min(1, "Search query cannot be empty").describe("Search query for courses"),
})