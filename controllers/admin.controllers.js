import db from "../db/index.js";
import { asyncHandler } from "../utils/apiHandler.js";
import * as z from "zod";
import { CourseSectionSchema } from "../models/courseSectionSchema.model.js";
import { LessonSchema } from "../models/lessonSchema.model.js";

export const getAllInstructorsController = asyncHandler(async (req, res) => {
    const allInstructors = db.prepare("SELECT id,first_name,last_name,email,phone_number,skills,role,email_verified,created_at,updated_at,admin_verified FROM instructors").all();
    const normalized = allInstructors.map(i => ({
        ...i,
        skills: JSON.parse(i.skills),
    }));
    res.status(200).json({ success: true, data: normalized });
})

export const approveInstructorController = asyncHandler(async (req, res) => {
    const instructorId = Number(req.params.id);
    if (!Number.isInteger(instructorId)) {
        const err = new Error("Invalid instructor id");
        err.statusCode = 400;
        throw err;
    }

    const result = db.prepare("UPDATE instructor_profile SET admin_verified = 1 WHERE user_id = ?").run(instructorId);
    if (result.changes === 0) {
        const err = new Error("Instructor not found or already approved");
        err.statusCode = 404;
        throw err;
    }
    res.status(200).json({ success: true, message: "Instructor approved successfully" });
})

export const assignCourseToInstructorController = asyncHandler(async (req, res) => {
    const courseId = Number(req.params.courseId);
    const instructorId = Number(req.params.instructorId);
    if (!Number.isInteger(courseId) || !Number.isInteger(instructorId)) {
        const err = new Error("Invalid course id or instructor id");
        err.statusCode = 400;
        throw err;
    }
    try {
        db.prepare(`INSERT INTO course_instructors (course_id, instructor_id) VALUES (?, ?)`).run(courseId, instructorId);
    } catch (err) {
        if (err.code === "SQLITE_CONSTRAINT_PRIMARYKEY") {
            err.message = "Instructor already assigned to this course";
            err.statusCode = 409;
            throw err;
        }

        if (err.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
            err.message = "Course or Instructor not found";
            err.statusCode = 404;
            throw err;
        }

        throw err;
    }
    res.status(200).json({ success: true, message: "Course assigned to instructor successfully" });
})

export const unassignCourseFromInstructorController = asyncHandler(async (req, res) => {
    const courseId = Number(req.params.courseId);
    const instructorId = Number(req.params.instructorId);
    if (!Number.isInteger(courseId) || !Number.isInteger(instructorId)) {
        const err = new Error("Invalid course id or instructor id");
        err.statusCode = 400
        throw err
    }
    const result = db.prepare("DELETE FROM course_instructors WHERE course_id = ? AND instructor_id = ?").run(courseId, instructorId);
    if (result.changes === 0) {
        const err = new Error("Instructor not assigned to this course");
        err.statusCode = 404;
        throw err;
    }
    res.status(200).json({ success: true, message: "Course unassigned from instructor successfully" });
})

export const getAllStudentsController = asyncHandler(async (req, res) => {
    const result = db.prepare("SELECT id,first_name,last_name,email,phone_number,role,email_verified,created_at,updated_at FROM users WHERE role = 'student'").all();
    res.status(200).json({ success: true, data: result });
})

export const deleteUserController = asyncHandler(async (req, res) => {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId)) {
        const err = new Error("Invalid user id");
        err.statusCode = 400;
        throw err;
    }
    const user = db.prepare("SELECT id, first_name, last_name, email, phone_number, role FROM users WHERE id = ? AND role IN ('student', 'instructor')").get(userId);
    if (!user) {
        const err = new Error("User not found or cannot be deleted");
        err.statusCode = 404;
        throw err;
    }
    const { id: adminId } = req.admin;
    const tx = db.transaction(() => {
        db.prepare("INSERT INTO deleted_users (user_id, first_name, last_name, email, phone_number, role, deleted_by) VALUES (?, ?, ?, ?, ?, ?, ?)").run(user.id, user.first_name, user.last_name, user.email, user.phone_number, user.role, adminId);
        db.prepare("DELETE FROM users WHERE id = ?").run(user.id);
    });
    tx();
    res.status(200).json({ success: true, message: `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} deleted successfully` });
})

export const getDeletedUsersController = asyncHandler(async (req, res) => {
    const result = db.prepare("SELECT du.id, du.user_id, du.first_name, du.last_name, du.email, du.phone_number, du.role, du.deleted_at, u.first_name || ' ' || u.last_name AS deleted_by_name FROM deleted_users du LEFT JOIN users u ON u.id = du.deleted_by ORDER BY du.deleted_at DESC").all();
    res.status(200).json({ success: true, data: result });
})

export const addCourseSectionController = asyncHandler((req, res) => {
    const courseId = Number(req.params.courseId);
    if (!Number.isInteger(courseId)) {
        const err = new Error("Invalid course ID");
        err.statusCode = 400;
        throw err;
    }

    const course = db.prepare("SELECT id FROM courses WHERE id = ?").get(courseId);
    if (!course) {
        const err = new Error("Course not found");
        err.statusCode = 404;
        throw err;
    }

    const body = CourseSectionSchema.safeParse(req.body);
    if (!body.success) {
        const error = new Error(z.prettifyError(body.error));
        error.statusCode = 400;
        throw error;
    }

    const { title, position } = body.data;
    try {
        const result = db.prepare("INSERT INTO course_sections (course_id, title, position) VALUES (?, ?, ?)").run(courseId, title.trim(), position);
        res.status(201).json({ message: "Section added successfully", data: { sectionId: result.lastInsertRowid } });
    } catch (e) {
        if (e.code === "SQLITE_CONSTRAINT_UNIQUE") {
            const err = new Error("Section position already exists for this course");
            err.statusCode = 409;
            throw err;
        }
        throw e;
    }
})

export const updateCourseSectionController = asyncHandler((req, res) => {
    const sectionId = Number(req.params.sectionId);
    if (!Number.isInteger(sectionId)) {
        const err = new Error("Invalid section ID");
        err.statusCode = 400;
        throw err;
    }

    const body = CourseSectionSchema.safeParse(req.body);
    if (!body.success) {
        const error = new Error(z.prettifyError(body.error));
        error.statusCode = 400;
        throw error;
    }

    const { title, position } = body.data;
    try {
        const result = db.prepare("UPDATE course_sections SET title = ?, position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(title.trim(), position, sectionId);
        if (result.changes === 0) {
            const err = new Error("Section not found");
            err.statusCode = 404;
            throw err;
        }
        res.status(200).json({ message: "Section updated successfully" });
    } catch (e) {
        if (e.code === "SQLITE_CONSTRAINT_UNIQUE") {
            const err = new Error("Section position already exists for this course");
            err.statusCode = 409;
            throw err;
        }
        throw e;
    }
})

export const deleteCourseSectionController = asyncHandler((req, res) => {
    const sectionId = Number(req.params.sectionId);
    if (!Number.isInteger(sectionId)) {
        const err = new Error("Invalid section ID");
        err.statusCode = 400;
        throw err;
    }

    const result = db.prepare("DELETE FROM course_sections WHERE id = ?").run(sectionId);
    if (result.changes === 0) {
        const err = new Error("Section not found");
        err.statusCode = 404;
        throw err;
    }
    res.status(200).json({ message: "Section deleted successfully" });
})

export const addLessonController = asyncHandler((req, res) => {
    const sectionId = Number(req.params.sectionId);
    if (!Number.isInteger(sectionId)) {
        const err = new Error("Invalid section ID");
        err.statusCode = 400;
        throw err;
    }

    const section = db.prepare("SELECT id FROM course_sections WHERE id = ?").get(sectionId);
    if (!section) {
        const err = new Error("Section not found");
        err.statusCode = 404;
        throw err;
    }

    const body = LessonSchema.safeParse(req.body);
    if (!body.success) {
        const error = new Error(z.prettifyError(body.error));
        error.statusCode = 400;
        throw error;
    }

    const { title, content_type, content_url, duration_minutes, is_preview, position } = body.data;
    try {
        const result = db.prepare("INSERT INTO lessons (section_id, title, content_type, content_url, duration_minutes, is_preview, position) VALUES (?, ?, ?, ?, ?, ?, ?)").run(sectionId, title.trim(), content_type, content_url || null, duration_minutes || null, is_preview ? 1 : 0, position);
        res.status(201).json({ message: "Lesson added successfully", data: { lessonId: result.lastInsertRowid } });
    } catch (e) {
        if (e.code === "SQLITE_CONSTRAINT_UNIQUE") {
            const err = new Error("Lesson position already exists for this section");
            err.statusCode = 409;
            throw err;
        }
        throw e;
    }
})

export const updateLessonController = asyncHandler((req, res) => {
    const lessonId = Number(req.params.lessonId);
    if (!Number.isInteger(lessonId)) {
        const err = new Error("Invalid lesson ID");
        err.statusCode = 400;
        throw err;
    }

    const body = LessonSchema.safeParse(req.body);
    if (!body.success) {
        const error = new Error(z.prettifyError(body.error));
        error.statusCode = 400;
        throw error;
    }

    const { title, content_type, content_url, duration_minutes, is_preview, position } = body.data;
    try {
        const result = db.prepare("UPDATE lessons SET title = ?, content_type = ?, content_url = ?, duration_minutes = ?, is_preview = ?, position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(title.trim(), content_type, content_url || null, duration_minutes || null, is_preview ? 1 : 0, position, lessonId);
        if (result.changes === 0) {
            const err = new Error("Lesson not found");
            err.statusCode = 404;
            throw err;
        }
        res.status(200).json({ message: "Lesson updated successfully" });
    } catch (e) {
        if (e.code === "SQLITE_CONSTRAINT_UNIQUE") {
            const err = new Error("Lesson position already exists for this section");
            err.statusCode = 409;
            throw err;
        }
        throw e;
    }
})

export const deleteLessonController = asyncHandler((req, res) => {
    const lessonId = Number(req.params.lessonId);
    if (!Number.isInteger(lessonId)) {
        const err = new Error("Invalid lesson ID");
        err.statusCode = 400;
        throw err;
    }

    const result = db.prepare("DELETE FROM lessons WHERE id = ?").run(lessonId);
    if (result.changes === 0) {
        const err = new Error("Lesson not found");
        err.statusCode = 404;
        throw err;
    }
    res.status(200).json({ message: "Lesson deleted successfully" });
})