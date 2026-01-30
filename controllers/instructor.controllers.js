import { asyncHandler } from "../utils/apiHandler.js";
import db from "../db/index.js"

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