-- Employee Database Schema for Marin Pest Control
-- This table will be used for Directory, Work Assignments, Punch Clock, and Payroll

-- Create employees table with comprehensive fields
CREATE TABLE IF NOT EXISTS employees (
    -- Primary identification
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(20) UNIQUE NOT NULL, -- Company employee ID (e.g., "EMP001")
    
    -- Personal information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    preferred_name VARCHAR(100), -- Nickname or preferred name
    
    -- Contact information
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    mobile VARCHAR(20),
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(100),
    
    -- Address information
    street_address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    
    -- Employment details
    hire_date DATE NOT NULL,
    termination_date DATE,
    employment_status VARCHAR(20) DEFAULT 'active' CHECK (employment_status IN ('active', 'inactive', 'terminated', 'on_leave')),
    employment_type VARCHAR(20) DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contractor', 'temporary')),
    
    -- Job information
    job_title VARCHAR(100),
    department VARCHAR(100),
    supervisor_id INTEGER REFERENCES employees(id),
    pay_rate DECIMAL(10,2), -- Hourly rate
    salary DECIMAL(10,2), -- Annual salary (if applicable)
    pay_frequency VARCHAR(20) DEFAULT 'hourly' CHECK (pay_frequency IN ('hourly', 'weekly', 'bi_weekly', 'monthly', 'annual')),
    
    -- Work schedule
    work_schedule JSONB, -- Store schedule as JSON (e.g., {"monday": "8:00-17:00", "tuesday": "8:00-17:00"})
    timezone VARCHAR(50) DEFAULT 'America/Los_Angeles',
    
    -- Authentication & Access
    password_hash VARCHAR(255), -- For local login
    google_id VARCHAR(100), -- For Google OAuth
    role VARCHAR(50) DEFAULT 'employee' CHECK (role IN ('admin', 'supervisor', 'employee', 'contractor')),
    permissions JSONB, -- Store specific permissions as JSON
    
    -- Time tracking
    clock_in_location VARCHAR(255), -- GPS coordinates or location name
    clock_out_location VARCHAR(255),
    last_clock_in TIMESTAMP,
    last_clock_out TIMESTAMP,
    total_hours_worked DECIMAL(8,2) DEFAULT 0,
    
    -- Payroll information
    social_security_number VARCHAR(11), -- Encrypted
    tax_id VARCHAR(20),
    w4_filing_status VARCHAR(20),
    w4_allowances INTEGER DEFAULT 0,
    direct_deposit_account VARCHAR(50), -- Encrypted
    direct_deposit_routing VARCHAR(20), -- Encrypted
    
    -- Benefits
    health_insurance BOOLEAN DEFAULT false,
    dental_insurance BOOLEAN DEFAULT false,
    vision_insurance BOOLEAN DEFAULT false,
    retirement_401k BOOLEAN DEFAULT false,
    vacation_days INTEGER DEFAULT 0,
    sick_days INTEGER DEFAULT 0,
    personal_days INTEGER DEFAULT 0,
    
    -- Performance & Training
    performance_rating DECIMAL(3,2), -- 1.00 to 5.00
    last_review_date DATE,
    next_review_date DATE,
    certifications JSONB, -- Store certifications as JSON
    training_completed JSONB, -- Store training records as JSON
    
    -- Equipment & Tools
    assigned_equipment JSONB, -- Store equipment assignments as JSON
    vehicle_assignment VARCHAR(100),
    uniform_size VARCHAR(20),
    
    -- Notes & Comments
    notes TEXT,
    internal_notes TEXT, -- Admin-only notes
    
    -- System fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES employees(id),
    updated_by INTEGER REFERENCES employees(id),
    
    -- Soft delete
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP,
    deleted_by INTEGER REFERENCES employees(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(employment_status);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_supervisor ON employees(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_employees_hire_date ON employees(hire_date);
CREATE INDEX IF NOT EXISTS idx_employees_created_at ON employees(created_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_employees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_employees_updated_at();

-- Insert some sample employees for testing
INSERT INTO employees (
    employee_id, first_name, last_name, email, phone, hire_date, 
    job_title, department, pay_rate, role, employment_status
) VALUES 
(
    'EMP001', 'Spencer', 'Reiser', 'spencer@marinpestcontrol.com', 
    '(555) 123-4567', '2024-01-15', 'Owner/Manager', 'Management', 
    75.00, 'admin', 'active'
),
(
    'EMP002', 'John', 'Smith', 'john.smith@marinpestcontrol.com', 
    '(555) 234-5678', '2024-02-01', 'Senior Technician', 'Field Operations', 
    35.00, 'supervisor', 'active'
),
(
    'EMP003', 'Sarah', 'Johnson', 'sarah.johnson@marinpestcontrol.com', 
    '(555) 345-6789', '2024-02-15', 'Technician', 'Field Operations', 
    28.00, 'employee', 'active'
),
(
    'EMP004', 'Mike', 'Davis', 'mike.davis@marinpestcontrol.com', 
    '(555) 456-7890', '2024-03-01', 'Technician', 'Field Operations', 
    26.00, 'employee', 'active'
),
(
    'EMP005', 'Lisa', 'Wilson', 'lisa.wilson@marinpestcontrol.com', 
    '(555) 567-8901', '2024-03-15', 'Office Manager', 'Administration', 
    25.00, 'employee', 'active'
);

-- Create a view for active employees only
CREATE OR REPLACE VIEW active_employees AS
SELECT 
    id, employee_id, first_name, last_name, preferred_name,
    email, phone, mobile, hire_date, job_title, department,
    supervisor_id, pay_rate, role, employment_status,
    created_at, updated_at
FROM employees 
WHERE employment_status = 'active' 
AND is_deleted = false;

-- Create a view for employee directory (public info only)
CREATE OR REPLACE VIEW employee_directory AS
SELECT 
    employee_id, first_name, last_name, preferred_name,
    email, phone, job_title, department, hire_date
FROM employees 
WHERE employment_status = 'active' 
AND is_deleted = false;

-- Add comments for documentation
COMMENT ON TABLE employees IS 'Comprehensive employee information for Directory, Work Assignments, Punch Clock, and Payroll systems';
COMMENT ON COLUMN employees.employee_id IS 'Company-assigned employee ID (e.g., EMP001)';
COMMENT ON COLUMN employees.preferred_name IS 'Nickname or preferred name for display';
COMMENT ON COLUMN employees.work_schedule IS 'JSON object storing work schedule (e.g., {"monday": "8:00-17:00"})';
COMMENT ON COLUMN employees.permissions IS 'JSON object storing specific permissions and access rights';
COMMENT ON COLUMN employees.certifications IS 'JSON array storing certifications and expiration dates';
COMMENT ON COLUMN employees.training_completed IS 'JSON array storing training records and completion dates';
COMMENT ON COLUMN employees.assigned_equipment IS 'JSON array storing equipment assignments and serial numbers';
