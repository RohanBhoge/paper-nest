-- Add database indexes for better query performance
-- Run this script: mysql -u root -p u558197017_Login < backend/scripts/add-indexes.sql

USE u558197017_Login;

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_subscription_end ON users(subscription_end_date);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_organization_name ON users(organization_name);

-- Papers table indexes
CREATE INDEX IF NOT EXISTS idx_papers_user_id ON papers(user_id);
CREATE INDEX IF NOT EXISTS idx_papers_created_at ON papers(created_at);
CREATE INDEX IF NOT EXISTS idx_papers_exam_type ON papers(exam_type);

-- Students table indexes
CREATE INDEX IF NOT EXISTS idx_students_admin_user_id ON students(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_std ON students(std);

-- Organization notifications table indexes
CREATE INDEX IF NOT EXISTS idx_organization_notifications_user_id ON organization_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_notifications_created_at ON organization_notifications(created_at);

-- Show all indexes to verify
SHOW INDEX FROM users;
SHOW INDEX FROM papers;
SHOW INDEX FROM students;
SHOW INDEX FROM organization_notifications;
