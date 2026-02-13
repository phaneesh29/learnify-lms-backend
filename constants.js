export const PORT = process.env.PORT || 8080;
export const ORIGIN = process.env.ORIGIN || 'http://localhost:3000';
export const JWT_SECRET = process.env.JWT_SECRET;
export const RESEND_API_KEY = process.env.RESEND_API_KEY;
export const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: false,
    sameSite: 'Strict',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
};