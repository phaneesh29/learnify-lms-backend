# Learnify Server 🚀

**Lightweight Express + SQLite backend** for the Learnify project. This repository provides authentication (admin, student, instructor), email verification, course-related schemas, and utilities. This README explains how to set up, run, and test the server locally.

---

## 🔧 Prerequisites

- Node.js (v16+ recommended)
- npm (or yarn)
- (Optional) A Resend account and API key if you want email sending to work in development

---

## ⚙️ Quick Start

1. Install dependencies

```bash
npm install
```

2. Create a `.env` file in the project root (see **Environment** below)

3. Initialize the database (creates `db/learnify.db` and all tables)

```bash
npm run initdb
```

4. Seed an initial admin account

```bash
npm run seed:admin
```

> Default seeded admin: `admin@learnify.com` with password `admin123@2026` — **login and change this password immediately** ✅

5. Start the server

- Development (with auto-reload):

```bash
npm run dev
```

- Production:

```bash
npm start
```

Server listens on `PORT` (default: `8080`).

---

## 🧾 Environment Variables

Create a `.env` file and set the following (example):

```env
PORT=8080
ORIGIN=http://localhost:5173
JWT_SECRET=your_long_random_secret
RESEND_API_KEY=key_live_XXXXXXXXXXXXX  # optional - required for email sending
```

- **JWT_SECRET** (required) — used to sign access tokens. Set a long randomly generated string.
- **RESEND_API_KEY** (optional) — if provided, the app will attempt to send verification emails using Resend.
- **ORIGIN** and **PORT** are optional (defaults shown above).

---

## 🔒 Authentication & Cookies

- Tokens are JWTs that expire in 1 day.
- Cookies used:
  - `adminToken` — admin auth cookie
  - `studentToken` — student auth cookie
  - `instructorToken` — instructor auth cookie
- Cookies are `httpOnly`, `sameSite: Strict`, `maxAge: 1 day` (not secure by default in development). Update `COOKIE_OPTIONS` in `constants.js` for production.

---

## 🗂 Database

- Uses SQLite via `better-sqlite3`.
- DB file: `db/learnify.db` (created by `npm run initdb`).
- Schema defined in `sql/tables.sql` and includes tables for `users`, `courses`, `instructor_profile`, `instructor_skills`, `enrollments`, `payments`, `course_sections`, `lessons`, `assignments`, `assignment_submissions`, and `lesson_progress`.

---

## 🔁 Rate Limits

- Global: 100 requests per 15 minutes
- Login attempts: 3 requests per minute (applies to login endpoints)
- Verify email/resend: 1 request per minute

---

## 📡 Available Endpoints (Overview)

> All endpoints are prefixed with `/api`

### Health
- GET `/api/health` — basic health check

### Admin (requires admin cookie or authorization header)
- POST `/api/auth/admin/login` — body: `{ email, password }` → sets cookie `adminToken`
- POST `/api/auth/admin/register` — **protected** (admin only)
- GET `/api/auth/admin/profile` — **protected**
- GET `/api/auth/admin/logout` — clears `adminToken`

### Student
- POST `/api/auth/student/register` — body: `{ first_name, last_name, email, password, phone_number }` (sends verification email when possible)
- POST `/api/auth/student/login` — body: `{ email, password }` (requires email verified)
- POST `/api/auth/student/resend-email` — body: `{ email }` (rate-limited)
- POST `/api/auth/student/verify` — body: `{ token }` (verify using token from email)
- GET `/api/auth/student/profile` — **protected** (requires `studentToken`)
- GET `/api/auth/student/logout` — clears `studentToken`

### Instructor
- POST `/api/instructor/add-skill` — **protected** (Instructor token required). Body: `{ skills: ["skill1","skill2"] }`

### Courses
- Route exists at `/api/courses` — currently placeholder (see `routes/course.routes.js`).

---

## ✉️ Email Verification

- Verification tokens are 10-minute tokens stored hashed in DB (`verify_token` + `verify_expiry`).
- When a user registers, `sendVerifyEmail` will attempt to send an email (only if `RESEND_API_KEY` is set).
- You can verify using the token via `POST /api/auth/student/verify` with `{ token }`.

---

## 🧪 Examples (curl)

Register student:

```bash
curl -X POST http://localhost:8080/api/auth/student/register \
  -H "Content-Type: application/json" \
  -d '{"first_name":"John","last_name":"Doe","email":"john@example.com","password":"password123","phone_number":"9876543210"}'
```

Login student (after verification):

```bash
curl -X POST http://localhost:8080/api/auth/student/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"john@example.com","password":"password123"}'
```

Access protected route with cookie (profile):

```bash
curl http://localhost:8080/api/auth/student/profile -b cookies.txt
```

Alternatively send token in Authorization header:

```bash
curl http://localhost:8080/api/auth/student/profile -H "Authorization: Bearer <token>"
```

---

## ✅ Tips & Troubleshooting

- If you see `Invalid or expired token`, ensure your `JWT_SECRET` is set and tokens are not expired.
- If email sending fails, confirm `RESEND_API_KEY` is valid — registration still works but emails will not be delivered.
- If seeded admin already exists, `npm run seed:admin` will skip creating a new one.

---

## 🧾 Development Notes

- Code uses ESM (`type: module` in `package.json`).
- Linting/testing not included in this project scaffold.


---

Made with ❤️ — Learnify team
