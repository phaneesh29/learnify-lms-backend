import db from "../db/index.js";
import { hashedPassword } from "../utils/hashPassword.js";

const seedAdmin = async () => {
    try {
        console.log("🌱 Seeding admin user...");
        const password_hash = await hashedPassword("admin123@2026");
        const firstAdmin = {
            "first_name": "Admin",
            "last_name": "Learnify",
            "email": "admin@learnify.com",
            "password_hash": password_hash,
            "phone_number": "7259549529",
            "role": "admin",
            "email_verified": 1
        }
        const exisitngAdmin = db.prepare("SELECT 1 FROM users WHERE role = 'admin'").get();
        if (exisitngAdmin) {
            console.log("Admin user already exists. Skipping seeding.");
            process.exit(0);
        }
        db.prepare(`INSERT INTO users (first_name, last_name, email, password_hash, phone_number, role, email_verified, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).run(
            firstAdmin.first_name,
            firstAdmin.last_name,
            firstAdmin.email,
            firstAdmin.password_hash,
            firstAdmin.phone_number,
            firstAdmin.role,
            firstAdmin.email_verified
        );
        console.log("Admin user created successfully.");
        console.log("⚠️ LOGIN AND CHANGE PASSWORD IMMEDIATELY");

    } catch (error) {
        console.error("Admin seeding failed.");
        console.error(error.message);
        process.exit(1);
    }
}

seedAdmin();