PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone_number TEXT UNIQUE,
    role TEXT CHECK (
        role IN (
            'student',
            'instructor',
            'admin'
        )
    ) NOT NULL DEFAULT 'student',
    email_verified BOOLEAN NOT NULL DEFAULT 0,
    verify_token TEXT DEFAULT NULL,
    verify_expiry TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS instructor_profile (
    user_id INTEGER PRIMARY KEY,
    admin_verified BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS instructor_skills (
    instructor_id INTEGER NOT NULL,
    skill TEXT NOT NULL,
    PRIMARY KEY (instructor_id, skill),
    FOREIGN KEY (instructor_id) REFERENCES instructor_profile (user_id)
);

CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    duration_hours INTEGER NOT NULL CHECK (duration_hours > 0),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT 0,
    rating INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL,
    CHECK (end_date >= start_date),
    FOREIGN KEY (created_by) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS course_instructors (
    course_id INTEGER NOT NULL,
    instructor_id INTEGER NOT NULL,
    PRIMARY KEY (course_id, instructor_id),
    FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES instructor_profile (user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY,
    course_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    status TEXT CHECK (
        status IN (
            'pending',
            'enrolled',
            'completed',
            'cancelled'
        )
    ) NOT NULL DEFAULT 'pending',
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (course_id, student_id),
    FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY,
    enrollment_id INTEGER UNIQUE NOT NULL,
    amount INTEGER NOT NULL CHECK (amount >= 0),
    gateway_reference TEXT,
    payment_status TEXT CHECK (
        payment_status IN (
            'pending',
            'completed',
            'failed'
        )
    ) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES enrollments (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS course_sections (
    id INTEGER PRIMARY KEY,
    course_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    position INTEGER NOT NULL CHECK (position > 0),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (course_id, position),
    FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY,
    section_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content_type TEXT CHECK (
        content_type IN ('video', 'article', 'quiz')
    ) NOT NULL,
    content_url TEXT,
    duration_minutes INTEGER CHECK (duration_minutes > 0),
    is_preview BOOLEAN NOT NULL DEFAULT 0,
    position INTEGER NOT NULL CHECK (position > 0),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (section_id, position),
    FOREIGN KEY (section_id) REFERENCES course_sections (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY,
    lesson_id INTEGER NOT NULL,
    instructions TEXT NOT NULL,
    due_date TIMESTAMP,
    max_score INTEGER CHECK (max_score > 0),
    status TEXT NOT NULL CHECK (
        status IN ('draft', 'open', 'closed')
    ) DEFAULT 'draft',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assignment_submissions (
    id INTEGER PRIMARY KEY,
    assignment_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    submission_content TEXT NOT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    score INTEGER CHECK (score >= 0),
    feedback TEXT,
    graded_at TIMESTAMP,
    graded_by INTEGER,
    UNIQUE (assignment_id, student_id),
    FOREIGN KEY (assignment_id) REFERENCES assignments (id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lesson_progress (
    id INTEGER PRIMARY KEY,
    lesson_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT 0,
    completed_at TIMESTAMP,
    UNIQUE (lesson_id, student_id), CHECK ((completed = 0 AND completed_at IS NULL) OR (completed = 1 AND completed_at IS NOT NULL)),
    FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_admin_email
ON users(email)
WHERE role = 'admin';
