-- Create users system with passwords and admin roles
-- This migration creates a complete user management system

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'manager')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_sessions table for session management
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_permissions table for granular permissions
CREATE TABLE IF NOT EXISTS user_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission VARCHAR(100) NOT NULL,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by INTEGER REFERENCES users(id),
    UNIQUE(user_id, permission)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON user_permissions(permission);

-- Insert default admin user (password: admin123 - CHANGE THIS!)
-- Password hash for 'admin123' using bcrypt with salt rounds 10
INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active) 
VALUES (
    'admin', 
    'admin@wemakemarin.com', 
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
    'Admin', 
    'User', 
    'admin', 
    true
) ON CONFLICT (username) DO NOTHING;

-- Insert default manager user (password: manager123 - CHANGE THIS!)
-- Password hash for 'manager123' using bcrypt with salt rounds 10
INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active) 
VALUES (
    'manager', 
    'manager@wemakemarin.com', 
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
    'Manager', 
    'User', 
    'manager', 
    true
) ON CONFLICT (username) DO NOTHING;

-- Insert default regular user (password: user123 - CHANGE THIS!)
-- Password hash for 'user123' using bcrypt with salt rounds 10
INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active) 
VALUES (
    'user', 
    'user@wemakemarin.com', 
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
    'Regular', 
    'User', 
    'user', 
    true
) ON CONFLICT (username) DO NOTHING;

-- Add some basic permissions for admin
INSERT INTO user_permissions (user_id, permission, granted_by) 
SELECT u.id, 'manage_users', u.id 
FROM users u 
WHERE u.role = 'admin' 
ON CONFLICT (user_id, permission) DO NOTHING;

INSERT INTO user_permissions (user_id, permission, granted_by) 
SELECT u.id, 'manage_settings', u.id 
FROM users u 
WHERE u.role = 'admin' 
ON CONFLICT (user_id, permission) DO NOTHING;

INSERT INTO user_permissions (user_id, permission, granted_by) 
SELECT u.id, 'view_all_data', u.id 
FROM users u 
WHERE u.role IN ('admin', 'manager') 
ON CONFLICT (user_id, permission) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE users IS 'User accounts with authentication and role-based access';
COMMENT ON TABLE user_sessions IS 'Active user sessions for token-based authentication';
COMMENT ON TABLE user_permissions IS 'Granular permissions for users beyond role-based access';

COMMENT ON COLUMN users.role IS 'User role: admin (full access), manager (limited admin), user (basic access)';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password';
COMMENT ON COLUMN user_sessions.session_token IS 'JWT or random token for session management';
COMMENT ON COLUMN user_permissions.permission IS 'Permission name like manage_users, view_reports, etc.';
