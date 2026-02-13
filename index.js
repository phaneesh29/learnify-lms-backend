import 'dotenv/config';
import app from './app.js';
import db from './db/index.js'
import { PORT } from './constants.js';

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});

process.on("SIGINT", () => {
    console.log("Closing database...");
    db.close();
    process.exit(0);
});