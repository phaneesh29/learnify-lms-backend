import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import db from "../db/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlFilePath = path.join(__dirname, "../sql/tables.sql");

try {
    console.log("Initializing database...");
    const schema = fs.readFileSync(sqlFilePath, "utf-8");
    db.transaction(() => {
        db.exec(schema);
    })();
    console.log("Database initialized successfully.");
} catch (error) {
    console.error("Database initialization failed.");
    console.error(error);
    process.exit(1);
}