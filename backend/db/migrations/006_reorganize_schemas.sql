-- Migration: Reorganize database schemas
-- This migration creates the new schema organization structure
-- google: Google Calendar events and work assignments
-- employee: Employee management and availability
-- time_clock: Time tracking and clock entries

-- ================================
-- CREATE SCHEMAS
-- ================================

CREATE SCHEMA IF NOT EXISTS google;
CREATE SCHEMA IF NOT EXISTS employee;
CREATE SCHEMA IF NOT EXISTS time_clock;

-- ================================
-- CREATE ENUMS
-- ================================

DO $$ BEGIN
    CREATE TYPE assignment_status AS ENUM ('pending', 'assigned', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE employee_role AS ENUM ('admin', 'manager', 'technician', 'trainee');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ================================
-- GOOGLE SCHEMA - Calendar Events
-- ================================

-- Google Calendar Events Table
CREATE TABLE IF NOT EXISTS google.events (
    id SERIAL PRIMARY KEY,
    google_event_id VARCHAR(255) NOT NULL UNIQUE,
    google_calendar_id VARCHAR(255) NOT NULL,
    
    -- Event details
    title VARCHAR(500) NOT NULL,
    description TEXT,
    location TEXT,
    
    -- Time
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    all_day BOOLEAN DEFAULT false,
    
    -- Customer info (parsed from event)
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_email VARCHAR(255),
    customer_address TEXT,
    
    -- QuickBooks link (optional)
    qb_customer_id INTEGER,
    
    -- Service details
    service_type VARCHAR(100), -- Insect Control, Rodent, Termite, etc.
    calendar_color VARCHAR(50),
    
    -- Status
    status VARCHAR(50) DEFAULT 'scheduled',
    cancelled BOOLEAN DEFAULT false,
    
    -- Sync metadata
    last_synced TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS google_events_google_event_idx ON google.events(google_event_id);
CREATE INDEX IF NOT EXISTS google_events_start_time_idx ON google.events(start_time);
CREATE INDEX IF NOT EXISTS google_events_service_type_idx ON google.events(service_type);

COMMENT ON TABLE google.events IS 'Google Calendar events synced to the dashboard';

-- Work Assignments Table
CREATE TABLE IF NOT EXISTS google.work_assignments (
    id SERIAL PRIMARY KEY,
    calendar_event_id INTEGER NOT NULL,
    employee_id INTEGER NOT NULL,
    
    -- Assignment details
    assigned_by INTEGER, -- Employee ID of admin who assigned
    assigned_at TIMESTAMP DEFAULT NOW() NOT NULL,
    
    -- Ordering (for service route)
    sequence_order INTEGER, -- 1, 2, 3... for the day
    
    -- Status
    status assignment_status DEFAULT 'assigned' NOT NULL,
    
    -- Completion tracking
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Notes
    admin_notes TEXT, -- Notes from admin when assigning
    employee_notes TEXT, -- Notes from employee after completion
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS google_assignments_event_idx ON google.work_assignments(calendar_event_id);
CREATE INDEX IF NOT EXISTS google_assignments_employee_idx ON google.work_assignments(employee_id);
CREATE INDEX IF NOT EXISTS google_assignments_date_idx ON google.work_assignments(assigned_at);
CREATE INDEX IF NOT EXISTS google_assignments_status_idx ON google.work_assignments(status);

COMMENT ON TABLE google.work_assignments IS 'Work assignments linking calendar events to employees';

-- ================================
-- EMPLOYEE SCHEMA - Employee Management
-- ================================

-- Employees Table
CREATE TABLE IF NOT EXISTS employee.employees (
    id SERIAL PRIMARY KEY,
    stack_user_id VARCHAR(100) UNIQUE, -- Link to Stack Auth
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    role employee_role DEFAULT 'technician' NOT NULL,
    active BOOLEAN DEFAULT true NOT NULL,
    
    -- Compensation
    hourly_rate DOUBLE PRECISION DEFAULT 25.0 NOT NULL,
    
    -- Availability
    default_start_time VARCHAR(10) DEFAULT '09:00', -- "HH:MM" format
    default_end_time VARCHAR(10) DEFAULT '17:00',
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS employee_employees_email_idx ON employee.employees(email);
CREATE INDEX IF NOT EXISTS employee_employees_active_idx ON employee.employees(active);
CREATE INDEX IF NOT EXISTS employee_employees_stack_user_idx ON employee.employees(stack_user_id);

COMMENT ON TABLE employee.employees IS 'Employee master table with compensation and role information';

-- Employee Availability Table
CREATE TABLE IF NOT EXISTS employee.availability (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employee.employees(id) ON DELETE CASCADE,
    
    -- Date
    date TIMESTAMP NOT NULL, -- Specific date
    
    -- Time range
    start_time VARCHAR(10) NOT NULL, -- "HH:MM"
    end_time VARCHAR(10) NOT NULL,
    
    -- Status
    available BOOLEAN DEFAULT true,
    reason TEXT, -- If unavailable: "PTO", "Sick", "Training", etc.
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS employee_availability_employee_date_idx ON employee.availability(employee_id, date);

COMMENT ON TABLE employee.availability IS 'Employee availability and scheduling exceptions';

-- Internal Notes Table
CREATE TABLE IF NOT EXISTS employee.internal_notes (
    id SERIAL PRIMARY KEY,
    
    -- What the note is about
    entity_type VARCHAR(50) NOT NULL, -- 'customer', 'job', 'employee', 'general'
    entity_id VARCHAR(100), -- ID of related entity (QB customer ID, employee ID, etc.)
    
    -- Note content
    title VARCHAR(255),
    content TEXT NOT NULL,
    
    -- Categorization
    category VARCHAR(50), -- 'important', 'followup', 'issue', 'general'
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    
    -- Pinning & visibility
    pinned BOOLEAN DEFAULT false,
    visible_to_all BOOLEAN DEFAULT false, -- If false, only admins see it
    
    -- Author
    created_by INTEGER NOT NULL REFERENCES employee.employees(id),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS employee_notes_entity_idx ON employee.internal_notes(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS employee_notes_category_idx ON employee.internal_notes(category);
CREATE INDEX IF NOT EXISTS employee_notes_created_by_idx ON employee.internal_notes(created_by);
CREATE INDEX IF NOT EXISTS employee_notes_pinned_idx ON employee.internal_notes(pinned);

COMMENT ON TABLE employee.internal_notes IS 'Internal company notes about customers, jobs, or employees';

-- ================================
-- TIME_CLOCK SCHEMA - Time Tracking
-- ================================

-- Time Entries Table
CREATE TABLE IF NOT EXISTS time_clock.time_entries (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employee.employees(id) ON DELETE CASCADE,
    
    -- Clock in/out times
    clock_in TIMESTAMP DEFAULT NOW() NOT NULL,
    clock_out TIMESTAMP,
    
    -- Duration (calculated on clock out)
    duration_minutes INTEGER,
    
    -- Device/Location tracking
    ip_address TEXT,
    user_agent TEXT,
    clock_in_location TEXT,
    clock_out_location TEXT,
    
    -- Suspicious activity flagging (silent to employee)
    flagged BOOLEAN DEFAULT false,
    flag_reason TEXT, -- e.g., "Late night clock-in", "Duplicate IP"
    
    -- Notes
    notes TEXT,
    
    -- Approval (for payroll)
    approved BOOLEAN DEFAULT false,
    approved_by INTEGER REFERENCES employee.employees(id),
    approved_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS time_clock_employee_idx ON time_clock.time_entries(employee_id);
CREATE INDEX IF NOT EXISTS time_clock_clock_in_idx ON time_clock.time_entries(clock_in);
CREATE INDEX IF NOT EXISTS time_clock_flagged_idx ON time_clock.time_entries(flagged);
CREATE INDEX IF NOT EXISTS time_clock_approved_idx ON time_clock.time_entries(approved);

COMMENT ON TABLE time_clock.time_entries IS 'Employee time clock entries with approval workflow';

-- Suspicious Terms Table
CREATE TABLE IF NOT EXISTS time_clock.suspicious_terms (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    
    -- Rule configuration (JSON for flexibility)
    rule_config JSON, -- e.g., { "time_range": ["00:00", "04:00"], "type": "late_night" }
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS time_clock_suspicious_active_idx ON time_clock.suspicious_terms(active);

COMMENT ON TABLE time_clock.suspicious_terms IS 'Admin-defined rules for flagging suspicious time entries';

-- ================================
-- DATA MIGRATION (if tables exist in public schema)
-- ================================

-- Migrate calendar_events to google.events (if exists in public)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'calendar_events') THEN
        INSERT INTO google.events (
            google_event_id, google_calendar_id, title, description, location,
            start_time, end_time, all_day, customer_name, customer_phone,
            customer_email, customer_address, qb_customer_id, service_type,
            calendar_color, status, cancelled, last_synced, created_at, updated_at
        )
        SELECT 
            google_event_id, google_calendar_id, title, description, location,
            start_time, end_time, all_day, customer_name, customer_phone,
            customer_email, customer_address, qb_customer_id, service_type,
            calendar_color, status, cancelled, last_synced, created_at, updated_at
        FROM public.calendar_events
        ON CONFLICT (google_event_id) DO NOTHING;
    END IF;
END $$;

-- Migrate employees to employee.employees (if exists in public)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
        INSERT INTO employee.employees (
            stack_user_id, email, first_name, last_name, phone, role, active,
            hourly_rate, default_start_time, default_end_time, notes,
            created_at, updated_at
        )
        SELECT 
            stack_user_id, email, first_name, last_name, phone, 
            CAST(role AS employee_role), active,
            hourly_rate, default_start_time, default_end_time, notes,
            created_at, updated_at
        FROM public.employees
        ON CONFLICT (email) DO NOTHING;
    END IF;
END $$;

-- Migrate time_entries to time_clock.time_entries (if exists in public)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'time_entries') THEN
        INSERT INTO time_clock.time_entries (
            employee_id, clock_in, clock_out, duration_minutes,
            ip_address, user_agent, clock_in_location, clock_out_location,
            flagged, flag_reason, notes, approved, approved_by, approved_at,
            created_at, updated_at
        )
        SELECT 
            employee_id, clock_in, clock_out, duration_minutes,
            ip_address, user_agent, clock_in_location, clock_out_location,
            flagged, flag_reason, notes, approved, approved_by, approved_at,
            created_at, updated_at
        FROM public.time_entries
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ================================
-- GRANT PERMISSIONS
-- ================================

-- Grant usage on schemas
GRANT USAGE ON SCHEMA google TO PUBLIC;
GRANT USAGE ON SCHEMA employee TO PUBLIC;
GRANT USAGE ON SCHEMA time_clock TO PUBLIC;

-- Grant permissions on tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA google TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA employee TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA time_clock TO PUBLIC;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA google TO PUBLIC;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA employee TO PUBLIC;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA time_clock TO PUBLIC;
