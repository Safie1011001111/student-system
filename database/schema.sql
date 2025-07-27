CREATE DATABASE student_activity_db;

-- Users table (นักเรียน + ครู)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    parent_phone VARCHAR(15) NOT NULL,
    role VARCHAR(10) DEFAULT 'student' CHECK (role IN ('student', 'teacher')),
    name VARCHAR(100),
    class_year INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activities table
CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    activity_name VARCHAR(200) NOT NULL,
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('ทำความดี', 'กิจกรรมรวมกัน')),
    activity_date DATE NOT NULL,
    activity_time TIME NOT NULL,
    location VARCHAR(200),
    description TEXT,
    image_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'รอตรวจสอบ' CHECK (status IN ('รอตรวจสอบ', 'อนุมัติแล้ว', 'ไม่ผ่าน')),
    teacher_comment TEXT,
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('success', 'warning', 'info', 'error')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Companion logs
CREATE TABLE ai_companion_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample data
INSERT INTO users (student_id, parent_phone, role, name, class_year) VALUES
('STU001', '0812345678', 'student', 'สมชาย ใจดี', 10),
('STU002', '0823456789', 'student', 'สมหญิง รักการเรียน', 11),
('TEA001', '0834567890', 'teacher', 'อาจารย์สมใจ', NULL);