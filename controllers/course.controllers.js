import { asyncHandler } from "../utils/apiHandler.js";
import db from "../db/index.js"
import * as z from "zod"
import { CourseSchema, CourseSearchSchema } from "../models/courseSchema.model.js";

export const createCourseController = asyncHandler((req, res) => {
    const body = CourseSchema.safeParse(req.body);
    if (!body.success) {
        const error = new Error(z.prettifyError(body.error))
        error.statusCode = 400;
        throw error;
    }
    const { title, description, intro_link, price, duration_hours, start_date, end_date } = body.data;
    const result = db.prepare("INSERT INTO courses (title, description, intro_link, price, duration_hours, start_date, end_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(title.trim(), description.trim(), intro_link || null, price, duration_hours, start_date.toISOString(), end_date.toISOString(), req.admin.id);
    res.status(201).json({ message: "Course created successfully", data: { courseId: result.lastInsertRowid } });
})

export const toggleVisibilityController = asyncHandler((req, res) => {
    const courseId = Number(req.params.courseId);
    if (!Number.isInteger(courseId)) {
        const err = new Error("Invalid course ID");
        err.statusCode = 400;
        throw err;
    }
    const result = db.prepare("UPDATE courses SET is_published = NOT is_published, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(courseId);
    if (result.changes === 0) {
        const err = new Error("Course not found");
        err.statusCode = 404;
        throw err;
    }
    res.status(200).json({ message: "Course visibility toggled successfully" });
});

export const viewAllCourseController = asyncHandler((req, res) => {
    const courses = db.prepare("SELECT id,title,description,intro_link,price,duration_hours,start_date,end_date,instructors,sections FROM course_details WHERE is_published = 1 ORDER BY created_at DESC").all();

    const normalized = courses.map(course => ({
        ...course,
        instructors: JSON.parse(course.instructors),
        sections: JSON.parse(course.sections).map(({ lessons, ...section }) => section),
    }));
    res.status(200).json({ success: true, data: normalized });
});

export const adminViewAllCourseController = asyncHandler((req, res) => {
    const courses = db.prepare("SELECT id,title,description,intro_link,price,duration_hours,start_date,end_date,is_published,instructors,sections FROM course_details ORDER BY created_at DESC").all();

    const normalized = courses.map(course => ({
        ...course,
        instructors: JSON.parse(course.instructors),
        sections: JSON.parse(course.sections),
    }));
    res.status(200).json({ success: true, data: normalized });
});

export const viewCourseByIdController = asyncHandler((req, res) => {
    const courseId = Number(req.params.courseId);
    if (!Number.isInteger(courseId)) {
        const err = new Error("Invalid course ID");
        err.statusCode = 400;
        throw err;
    }
    const course = db.prepare("SELECT id,title,description,intro_link,price,duration_hours,start_date,end_date,instructors,sections FROM course_details WHERE id = ? AND is_published = 1").get(courseId);
    if (!course) {
        const err = new Error("Course not found");
        err.statusCode = 404;
        throw err;
    }
    course.instructors = JSON.parse(course.instructors);
    course.sections = JSON.parse(course.sections).map(({ lessons, ...section }) => section);
    res.status(200).json({ success: true, data: course });
});

export const updateCourseByIdController = asyncHandler((req, res) => {
    const courseId = Number(req.params.courseId);
    if (!Number.isInteger(courseId)) {
        const err = new Error("Invalid course ID");
        err.statusCode = 400;
        throw err;
    }
    const body = CourseSchema.safeParse(req.body);
    if (!body.success) {
        const error = new Error(z.prettifyError(body.error))
        error.statusCode = 400;
        throw error;
    }
    const { title, description, intro_link, price, duration_hours, start_date, end_date } = body.data;
    const result = db.prepare("UPDATE courses SET title = ?, description = ?, intro_link = ?, price = ?, duration_hours = ?, start_date = ?, end_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(title.trim(), description.trim(), intro_link || null, price, duration_hours, start_date.toISOString(), end_date.toISOString(), courseId);
    if (result.changes === 0) {
        const err = new Error("Course not found");
        err.statusCode = 404;
        throw err;
    }
    res.status(200).json({ message: "Course updated successfully" });
});

export const deleteCourseByIdController = asyncHandler((req, res) => {
    const courseId = Number(req.params.courseId);
    if (!Number.isInteger(courseId)) {
        const err = new Error("Invalid course ID");
        err.statusCode = 400;
        throw err;
    }
    const result = db.prepare("DELETE FROM courses WHERE id = ?").run(courseId);
    if (result.changes === 0) {
        const err = new Error("Course not found");
        err.statusCode = 404;
        throw err;
    }
    res.status(200).json({ message: "Course deleted successfully" });
});

export const searchCoursesController = asyncHandler((req, res) => {
    const body = CourseSearchSchema.safeParse(req.body);
    if (!body.success) {
        const error = new Error(z.prettifyError(body.error))
        error.statusCode = 400;
        throw error;
    }
    const { query } = body.data;
    const searchTerm = `%${query.trim().toLocaleLowerCase()}%`;
    const courses = db.prepare("SELECT id,title,description,intro_link,price,duration_hours,start_date,end_date,instructors,sections FROM course_details WHERE is_published = 1 AND ((LOWER(title)) LIKE ? OR LOWER(description) LIKE ?) ORDER BY created_at DESC").all(searchTerm, searchTerm);
    const normalized = courses.map(course => ({
        ...course,
        instructors: JSON.parse(course.instructors),
        sections: JSON.parse(course.sections).map(({ lessons, ...section }) => section),
    }));
    res.status(200).json({ success: true, data: normalized });
})