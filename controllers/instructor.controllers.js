import { asyncHandler } from "../utils/apiHandler.js";
import db from "../db/index.js"

export const myCoursesController = asyncHandler((req, res) => {
    const instructorId = req.instructor.id;
    const courses = db.prepare(`
        SELECT cd.id, cd.title, cd.description, cd.intro_link, cd.price, cd.duration_hours, cd.start_date, cd.end_date, cd.is_published, cd.rating, cd.created_at, cd.updated_at, cd.instructors, cd.sections
        FROM course_details cd
        JOIN course_instructors ci ON ci.course_id = cd.id
        WHERE ci.instructor_id = ?
        ORDER BY cd.created_at DESC
    `).all(instructorId);

    const normalized = courses.map(course => ({
        ...course,
        instructors: JSON.parse(course.instructors),
        sections: JSON.parse(course.sections),
    }));
    res.status(200).json({ success: true, data: normalized });
})

export const instructorSkillsAddController = asyncHandler(async (req, res) => {
    let { skills } = req.body;
    if (!Array.isArray(skills) || skills.length === 0) {
        const error = new Error("Skills array is required");
        error.statusCode = 400;
        throw error;
    }
    const instructorId = req.instructor.id;

    skills = [...new Set(skills.map(s => typeof s === "string" ? s.trim().toLowerCase() : ""))].filter(Boolean)

    if (skills.length === 0) {
        const err = new Error("No valid skills provided");
        err.statusCode = 400;
        throw err;
    }

    try {
        const tx = db.transaction(() => {
            const stmt = db.prepare("INSERT INTO instructor_skills (instructor_id, skill) VALUES (?, ?)");
            for (const skill of skills) {
                stmt.run(instructorId, skill.trim());
            }
        })
        tx();
    } catch (e) {
        if (e.code?.startsWith("SQLITE_CONSTRAINT")) {
            const err = new Error("One or more skills already exist");
            err.statusCode = 409;
            throw err;
        }
        throw e;
    }
    res.status(201).json({ message: "Skills added successfully" });
})

export const instructorSkillsRemoveController = asyncHandler(async (req, res) => {
    const { skill } = req.body;
    const instructorId = Number(req.instructor.id);
    if (!skill || typeof skill !== "string" || skill.trim() === "") {
        const error = new Error("Skill is required and must be a non-empty string");
        error.statusCode = 400;
        throw error;
    }
    const skillToRemove = skill.trim().toLowerCase();
    const result = db.prepare("DELETE FROM instructor_skills WHERE instructor_id = ? AND skill = ?").run(instructorId, skillToRemove);
    if (result.changes === 0) {
        const error = new Error("Skill not found for this instructor");
        error.statusCode = 404;
        throw error;
    }
    res.json({ message: "Skill removed successfully" });
})