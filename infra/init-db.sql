-- Hospital Employee Tracker Database Initialization
-- Phase 1: Authentication & Security (v1.0)

-- Create ENUM types
CREATE TYPE account_status AS ENUM ('active', 'inactive', 'suspended', 'pending');
CREATE TYPE mfa_method AS ENUM ('totp', 'sms', 'email', 'backup_codes');
CREATE TYPE operation_type AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'LOGIN', 'LOGOUT', 'MFA_SETUP', 'PASSWORD_CHANGE');
CREATE TYPE event_category AS ENUM ('AUTH', 'PROFILE', 'ATTENDANCE', 'LEAVE', 'PAYROLL', 'DOCUMENT', 'HR', 'SYSTEM');

-- Create schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS employee;
CREATE SCHEMA IF NOT EXISTS audit;

-- Auth Schema: System Roles
CREATE TABLE auth.roles (
    id BIGSERIAL PRIMARY KEY,
    role_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Auth Schema: Permissions
CREATE TABLE auth.permissions (
    id BIGSERIAL PRIMARY KEY,
    permission_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    module VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Auth Schema: Role-Permission Mapping
CREATE TABLE auth.role_permissions (
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES auth.roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES auth.permissions(id) ON DELETE CASCADE
);

-- Employee Schema: Core Users
CREATE TABLE employee.users (
    id BIGSERIAL PRIMARY KEY,
    employee_code VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role_id BIGINT NOT NULL,
    account_status account_status DEFAULT 'pending',
    last_login TIMESTAMP,
    login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES auth.roles(id)
);

-- Auth Schema: MFA Configuration
CREATE TABLE auth.mfa_setup (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    mfa_method mfa_method NOT NULL,
    secret VARCHAR(255) NOT NULL, -- Encrypted
    is_enabled BOOLEAN DEFAULT FALSE,
    backup_codes TEXT[], -- JSON array, encrypted
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES employee.users(id) ON DELETE CASCADE
);

-- Auth Schema: User Sessions
CREATE TABLE auth.sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    access_token_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES employee.users(id) ON DELETE CASCADE
);

-- Auth Schema: Password History (prevent reuse)
CREATE TABLE auth.password_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES employee.users(id) ON DELETE CASCADE
);

-- Audit Schema: Comprehensive Audit Log
CREATE TABLE audit.audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    entity_type VARCHAR(100) NOT NULL,
    entity_id BIGINT,
    operation operation_type NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    status VARCHAR(20), -- 'success', 'failure'
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES employee.users(id) ON DELETE SET NULL
);

-- Audit Schema: Event Log (business events)
CREATE TABLE audit.event_log (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    category event_category NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES employee.users(id) ON DELETE SET NULL
);

-- Audit Schema: Sensitive Data Access Log
CREATE TABLE audit.sensitive_data_access_log (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    accessed_user_id BIGINT,
    field_name VARCHAR(255) NOT NULL, -- e.g., 'aadhaar', 'pan', 'bank_account'
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    purpose TEXT,
    ip_address VARCHAR(45),
    FOREIGN KEY (user_id) REFERENCES employee.users(id) ON DELETE SET NULL,
    FOREIGN KEY (accessed_user_id) REFERENCES employee.users(id) ON DELETE SET NULL
);

-- Seed: System Roles (v1.0)
INSERT INTO auth.roles (role_name, description) VALUES
('EMPLOYEE', 'Regular employee with self-service access'),
('MANAGER', 'Department manager with approval authority'),
('HR_ADMIN', 'HR administrator with full employee management access'),
('FINANCE_PAYROLL', 'Finance and payroll officer'),
('COMPLIANCE_AUDITOR', 'Compliance and audit officer'),
('SYSTEM_ADMIN', 'System administrator with full access')
ON CONFLICT DO NOTHING;

-- Seed: Permissions (sample for AUTH module)
INSERT INTO auth.permissions (permission_name, description, module) VALUES
('AUTH_LOGIN', 'Can login to the system', 'AUTH'),
('AUTH_LOGOUT', 'Can logout from the system', 'AUTH'),
('AUTH_MFA_SETUP', 'Can setup MFA', 'AUTH'),
('AUTH_PASSWORD_CHANGE', 'Can change own password', 'AUTH'),
('EMPLOYEE_PROFILE_VIEW', 'Can view own profile', 'EMPLOYEE'),
('EMPLOYEE_PROFILE_EDIT', 'Can edit own profile', 'EMPLOYEE'),
('EMPLOYEE_PROFILE_VIEW_ALL', 'Can view all employee profiles', 'EMPLOYEE'),
('EMPLOYEE_PROFILE_EDIT_ALL', 'Can edit all employee profiles', 'EMPLOYEE'),
('ATTENDANCE_VIEW', 'Can view own attendance', 'ATTENDANCE'),
('ATTENDANCE_APPROVE', 'Can approve attendance records', 'ATTENDANCE'),
('LEAVE_APPLY', 'Can apply for leave', 'LEAVE'),
('LEAVE_APPROVE', 'Can approve leave requests', 'LEAVE'),
('AUDIT_VIEW', 'Can view audit logs', 'AUDIT'),
('AUDIT_EXPORT', 'Can export audit logs', 'AUDIT')
ON CONFLICT DO NOTHING;

-- Seed: Role-Permission Mappings
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM auth.roles r, auth.permissions p
WHERE r.role_name = 'EMPLOYEE' AND p.permission_name IN ('AUTH_LOGIN', 'AUTH_LOGOUT', 'AUTH_MFA_SETUP', 'AUTH_PASSWORD_CHANGE', 'EMPLOYEE_PROFILE_VIEW', 'EMPLOYEE_PROFILE_EDIT', 'ATTENDANCE_VIEW', 'LEAVE_APPLY')
ON CONFLICT DO NOTHING;

INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM auth.roles r, auth.permissions p
WHERE r.role_name = 'MANAGER' AND p.permission_name IN ('AUTH_LOGIN', 'AUTH_LOGOUT', 'AUTH_PASSWORD_CHANGE', 'EMPLOYEE_PROFILE_VIEW_ALL', 'ATTENDANCE_APPROVE', 'LEAVE_APPROVE')
ON CONFLICT DO NOTHING;

INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM auth.roles r, auth.permissions p
WHERE r.role_name = 'HR_ADMIN' AND p.permission_name IN ('AUTH_LOGIN', 'AUTH_LOGOUT', 'AUTH_PASSWORD_CHANGE', 'EMPLOYEE_PROFILE_VIEW_ALL', 'EMPLOYEE_PROFILE_EDIT_ALL', 'ATTENDANCE_APPROVE', 'LEAVE_APPROVE', 'AUDIT_VIEW', 'AUDIT_EXPORT')
ON CONFLICT DO NOTHING;

INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM auth.roles r, auth.permissions p
WHERE r.role_name = 'SYSTEM_ADMIN'
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX idx_audit_log_user_date ON audit.audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_log_entity_date ON audit.audit_log(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_event_log_date ON audit.event_log(created_at DESC);
CREATE INDEX idx_sessions_user ON auth.sessions(user_id);
CREATE INDEX idx_mfa_setup_user ON auth.mfa_setup(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_roles_updated_at
BEFORE UPDATE ON auth.roles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON employee.users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mfa_setup_updated_at
BEFORE UPDATE ON auth.mfa_setup
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Phase 2: Employee Dashboard (v1.0)
-- ============================================================================

-- Employee Profile Details
CREATE TABLE employee.employee_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL,
    date_of_birth DATE,
    designation VARCHAR(255),
    work_location VARCHAR(255),
    reporting_manager_id BIGINT,
    date_of_joining DATE,
    profile_picture_url VARCHAR(500),
    mobile_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES employee.users(id) ON DELETE CASCADE,
    FOREIGN KEY (reporting_manager_id) REFERENCES employee.users(id) ON DELETE SET NULL
);

-- Attendance Records (for dashboard summary)
CREATE TABLE employee.attendance_records (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    attendance_date DATE NOT NULL,
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'present', -- present, absent, week_off, holiday, on_leave
    working_hours DECIMAL(5, 2),
    shift_code VARCHAR(20),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES employee.users(id) ON DELETE CASCADE,
    UNIQUE(user_id, attendance_date)
);

-- Leave Types & Balances
CREATE TYPE leave_type AS ENUM (
    'privilege_leave',
    'sick_leave',
    'casual_leave',
    'compensatory_leave',
    'bereavement_leave',
    'optional_leave',
    'paternity_leave',
    'wfh',
    'on_duty'
);

CREATE TABLE employee.leave_balances (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    leave_type leave_type NOT NULL,
    financial_year VARCHAR(10) NOT NULL, -- e.g., "2025-2026"
    total_days DECIMAL(5, 2) NOT NULL,
    used_days DECIMAL(5, 2) DEFAULT 0,
    remaining_days DECIMAL(5, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES employee.users(id) ON DELETE CASCADE,
    UNIQUE(user_id, leave_type, financial_year)
);

-- Leave Requests
CREATE TYPE leave_request_status AS ENUM ('applied', 'approved', 'rejected', 'cancelled', 'pending');

CREATE TABLE employee.leave_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    leave_type leave_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status leave_request_status DEFAULT 'applied',
    manager_id BIGINT,
    manager_remarks TEXT,
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP,
    attachment_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES employee.users(id) ON DELETE CASCADE,
    FOREIGN KEY (manager_id) REFERENCES employee.users(id) ON DELETE SET NULL
);

-- Holidays
CREATE TABLE employee.holidays (
    id BIGSERIAL PRIMARY KEY,
    holiday_name VARCHAR(255) NOT NULL,
    holiday_date DATE NOT NULL,
    description TEXT,
    is_optional BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(holiday_date)
);

-- Notifications
CREATE TYPE notification_type AS ENUM (
    'payslip',
    'leave_approval',
    'leave_rejection',
    'system_alert',
    'birthday',
    'anniversary'
);

CREATE TABLE employee.notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES employee.users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_employee_profiles_user ON employee.employee_profiles(user_id);
CREATE INDEX idx_employee_profiles_manager ON employee.employee_profiles(reporting_manager_id);
CREATE INDEX idx_attendance_records_user_date ON employee.attendance_records(user_id, attendance_date DESC);
CREATE INDEX idx_leave_balances_user_fy ON employee.leave_balances(user_id, financial_year);
CREATE INDEX idx_leave_requests_user ON employee.leave_requests(user_id, status);
CREATE INDEX idx_leave_requests_date_range ON employee.leave_requests(start_date, end_date);
CREATE INDEX idx_holidays_date ON employee.holidays(holiday_date);
CREATE INDEX idx_notifications_user ON employee.notifications(user_id, read);
CREATE INDEX idx_notifications_date ON employee.notifications(user_id, created_at DESC);

-- Create triggers for dashboard tables
CREATE TRIGGER update_employee_profiles_updated_at
BEFORE UPDATE ON employee.employee_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_records_updated_at
BEFORE UPDATE ON employee.attendance_records
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_balances_updated_at
BEFORE UPDATE ON employee.leave_balances
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at
BEFORE UPDATE ON employee.leave_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_holidays_updated_at
BEFORE UPDATE ON employee.holidays
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON employee.notifications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
