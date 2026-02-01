import { ORIGIN } from "../constants.js";
import db from "../db/index.js"
import { sendEmail } from "./email.js";
import crypto from "crypto";

export const sendVerifyEmail = async ({ to }) => {
    try {
        const user = db.prepare("SELECT first_name, email, email_verified FROM users WHERE email = ?").get(to);
        if (!user) {
            throw new Error("User not found");
        }
        if (user.email_verified) {
            return;
        }
        const token = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
        const verifyExpiry = Date.now() + 10 * 60 * 1000;

        db.prepare("UPDATE users SET verify_token = ?, verify_expiry = ? WHERE email = ?").run(hashedToken, verifyExpiry, to);
        const subject = "Verify your email address";
        const text = `Hello ${user.first_name},\n\nPlease verify your email address by clicking the link below:\n\n${ORIGIN}/verify-email?token=${encodeURIComponent(token)}\nThis link will expire in 10 minutes or copy the token below <br><p>${token}.</p><br>\n\nThank you!`;
        await sendEmail({ to, subject, text });

    } catch (error) {
        console.error("Error sending verification email:", error);
    }
}