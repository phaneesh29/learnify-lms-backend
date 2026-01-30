import db from "../db/index.js";
import { asyncHandler } from "../utils/apiHandler.js";

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