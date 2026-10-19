-- ==============================================================================
-- Enterprise HR & Social Insurance Management System
-- Database Schema (PostgreSQL & MySQL 8.0+ Compatible)
-- ==============================================================================

-- 1. Departments Table (الأقسام والإدارات)
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    name_ar VARCHAR(150) NOT NULL,
    name_zh VARCHAR(150) NOT NULL,
    manager_id VARCHAR(50),
    manager_name VARCHAR(150),
    employee_count INT DEFAULT 0,
    location VARCHAR(200),
    budget DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Positions Table (المسميات الوظيفية)
CREATE TABLE IF NOT EXISTS positions (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    title VARCHAR(150) NOT NULL,
    title_ar VARCHAR(150) NOT NULL,
    title_zh VARCHAR(150) NOT NULL,
    department_id VARCHAR(50) NOT NULL,
    department_name VARCHAR(150),
    min_salary DECIMAL(12, 2) DEFAULT 0.00,
    max_salary DECIMAL(12, 2) DEFAULT 0.00,
    level VARCHAR(50) DEFAULT 'Mid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_positions_department FOREIGN KEY (department_id) 
        REFERENCES departments(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 3. Employees Table (الموظفون وقاعدة البيانات الأساسية)
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(30) NOT NULL UNIQUE,       -- كود الموظف e.g. 180301001
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    arabic_name VARCHAR(200),                      -- الاسم بالعربي e.g. دنيا مدحت الدسوقي رزق
    chinese_name VARCHAR(100),                     -- الاسم بالصيني
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(30),
    avatar VARCHAR(255),
    national_id VARCHAR(20) NOT NULL UNIQUE,       -- الرقم القومي 14 رقم e.g. 29712051100088
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
    nationality VARCHAR(50) DEFAULT 'Egyptian',
    address TEXT,
    emergency_contact JSON,                        -- { name, relationship, phone }
    department_id VARCHAR(50) NOT NULL,
    department_name VARCHAR(150) NOT NULL,
    position_id VARCHAR(50) NOT NULL,
    position_title VARCHAR(150) NOT NULL,
    chinese_position VARCHAR(150),                 -- e.g. 主管1 - Supervisor 1, 司机 - Driver
    manager_id VARCHAR(50),
    manager_name VARCHAR(150),
    employment_status VARCHAR(20) DEFAULT 'active' CHECK (employment_status IN ('active', 'probation', 'on_leave', 'suspended', 'terminated')),
    employment_type VARCHAR(20) DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'intern')),
    hire_date DATE NOT NULL,
    probation_end_date DATE,
    resignation_date DATE,
    work_location VARCHAR(150) DEFAULT 'Main Facility',
    basic_salary DECIMAL(12, 2) DEFAULT 4325.00,
    housing_allowance DECIMAL(12, 2) DEFAULT 0.00,
    transport_allowance DECIMAL(12, 2) DEFAULT 0.00,
    contract_status VARCHAR(20) DEFAULT 'active' CHECK (contract_status IN ('active', 'expiring_soon', 'expired', 'pending_renewal')),
    document_completeness_percentage INT DEFAULT 100,
    missing_documents_count INT DEFAULT 0,
    
    -- Social Insurance Fields (حقول التأمين الاجتماعي)
    insurance_status VARCHAR(20) DEFAULT 'not_insured' CHECK (insurance_status IN ('insured', 'not_insured')),
    insurance_number VARCHAR(30),                  -- الرقم التأميني e.g. 58790872
    insurance_salary DECIMAL(12, 2) DEFAULT 4325.00, -- الأجر التأميني
    worker_share DECIMAL(12, 2) DEFAULT 475.85,    -- حصة العامل 11%
    company_share DECIMAL(12, 2) DEFAULT 811.13,   -- حصة الشركة 18.75%
    insurance_note VARCHAR(255),
    
    -- Hiring Documents Checklist (مسوغات التعيين)
    qualification_certificate_status VARCHAR(20) DEFAULT 'missing' CHECK (qualification_certificate_status IN ('missing', 'available')),
    birth_certificate_status VARCHAR(20) DEFAULT 'missing' CHECK (birth_certificate_status IN ('missing', 'available')),
    id_card_status VARCHAR(20) DEFAULT 'missing' CHECK (id_card_status IN ('missing', 'available')),
    contract_doc_status VARCHAR(20) DEFAULT 'missing' CHECK (contract_doc_status IN ('missing', 'available')),
    document_checklist_status VARCHAR(20) DEFAULT 'incomplete' CHECK (document_checklist_status IN ('incomplete', 'complete')),
    missing_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_employees_department FOREIGN KEY (department_id) 
        REFERENCES departments(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_employees_position FOREIGN KEY (position_id) 
        REFERENCES positions(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 4. Social Insurance Table (شيت التأمينات الاجتماعية - سبتمبر ومطابقة الهيئة)
CREATE TABLE IF NOT EXISTS social_insurance (
    id VARCHAR(50) PRIMARY KEY,
    serial_no INT NOT NULL,                        -- رقم المسلسل No
    national_id VARCHAR(20) NOT NULL,              -- ID. الرقم القومي
    employee_name VARCHAR(150) NOT NULL,           -- اسم الموظف
    department VARCHAR(50) NOT NULL,               -- القسم
    insurance_number VARCHAR(30) NOT NULL,         -- الرقم التأميني
    insurance_salary DECIMAL(12, 2) NOT NULL DEFAULT 4325.00, -- الأجر التأميني
    worker_share DECIMAL(12, 2) NOT NULL DEFAULT 475.85,    -- حصة العامل 11%
    company_share DECIMAL(12, 2) NOT NULL DEFAULT 811.13,   -- حصة الشركة 18.75%
    total_contribution DECIMAL(12, 2) NOT NULL DEFAULT 1286.98, -- إجمالي الاشتراك
    note VARCHAR(255),                             -- ملاحظات e.g. Start:2024-08-01
    employee_list_status VARCHAR(20) DEFAULT 'found' CHECK (employee_list_status IN ('found', 'not_found')),
    employee_code VARCHAR(30),                     -- كود الموظف إذا وجد
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Missing Documents Table (شيت مسوغات التعيين والأوراق الناقصة)
CREATE TABLE IF NOT EXISTS employee_missing_documents (
    id VARCHAR(50) PRIMARY KEY,
    serial_no INT NOT NULL,
    department VARCHAR(50) NOT NULL,
    employee_name VARCHAR(150) NOT NULL,
    national_id VARCHAR(20) NOT NULL,
    position VARCHAR(150) NOT NULL,
    start_date DATE,
    resignation_date DATE,
    employee_code VARCHAR(30) NOT NULL,
    insurance_status VARCHAR(20) DEFAULT 'not_insured',
    qualification_cert VARCHAR(20) DEFAULT 'missing' CHECK (qualification_cert IN ('missing', 'available')),
    birth_cert VARCHAR(20) DEFAULT 'missing' CHECK (birth_cert IN ('missing', 'available')),
    id_card VARCHAR(20) DEFAULT 'missing' CHECK (id_card IN ('missing', 'available')),
    contract VARCHAR(20) DEFAULT 'missing' CHECK (contract IN ('missing', 'available')),
    missing_count INT DEFAULT 4,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'incomplete' CHECK (status IN ('incomplete', 'complete')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Document Uploads Table (أرشيف المستندات والملفات المرفوعة)
CREATE TABLE IF NOT EXISTS document_records (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    employee_name VARCHAR(150) NOT NULL,
    department VARCHAR(50) NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('national_id', 'birth_certificate', 'qualification', 'contract', 'insurance', 'passport', 'medical', 'other')),
    title VARCHAR(200) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size VARCHAR(50),
    status VARCHAR(20) DEFAULT 'under_review' CHECK (status IN ('missing', 'uploaded', 'under_review', 'verified', 'rejected', 'expired')),
    expiry_date DATE,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP,
    verified_by VARCHAR(150),
    notes TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_documents_employee FOREIGN KEY (employee_id) 
        REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 7. Contracts Table (العقود الوظيفية)
CREATE TABLE IF NOT EXISTS contracts (
    id VARCHAR(50) PRIMARY KEY,
    contract_number VARCHAR(50) NOT NULL UNIQUE,
    employee_id VARCHAR(50) NOT NULL,
    employee_code VARCHAR(30) NOT NULL,
    employee_name VARCHAR(150) NOT NULL,
    department VARCHAR(50) NOT NULL,
    type VARCHAR(30) DEFAULT 'fixed_term' CHECK (type IN ('indefinite', 'fixed_term', 'probation', 'consultancy')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expiring_soon', 'expired', 'pending_renewal')),
    salary DECIMAL(12, 2) NOT NULL,
    notice_period_days INT DEFAULT 30,
    renewal_count INT DEFAULT 0,
    terms_summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_contracts_employee FOREIGN KEY (employee_id) 
        REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ==============================================================================
-- Performance Indexes (فهارس الأداء لتسريع الاستعلامات والبحث)
-- ==============================================================================
CREATE INDEX idx_employees_national_id ON employees(national_id);
CREATE INDEX idx_employees_code ON employees(employee_id);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_insurance_status ON employees(insurance_status);
CREATE INDEX idx_employees_status ON employees(employment_status);

CREATE INDEX idx_social_insurance_nat_id ON social_insurance(national_id);
CREATE INDEX idx_social_insurance_number ON social_insurance(insurance_number);
CREATE INDEX idx_social_insurance_status ON social_insurance(employee_list_status);

CREATE INDEX idx_missing_docs_employee ON employee_missing_documents(employee_code);
CREATE INDEX idx_missing_docs_status ON employee_missing_documents(status);

CREATE INDEX idx_documents_employee_id ON document_records(employee_id);
CREATE INDEX idx_contracts_employee_id ON contracts(employee_id);

-- ==============================================================================
-- 8. Drivers Fleet Table (سجل وإدارة السائقين والأسطول)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS drivers (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,              -- e.g. 'DRV-01', 'DRV-02'
    name VARCHAR(150) NOT NULL,                    -- اسم السائق e.g. 'احمد فريد'
    phone VARCHAR(30),
    national_id VARCHAR(20),
    vehicle_number VARCHAR(50),                    -- رقم اللوحة e.g. 'أ ب ج 1122'
    vehicle_type VARCHAR(100) DEFAULT 'جامبو 7000',-- e.g. 'جامبو 7000', 'دبابة', 'نقل ثقيل'
    default_category VARCHAR(30) DEFAULT 'production' CHECK (default_category IN ('management', 'production')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    joined_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_drivers_code ON drivers(code);

-- ==============================================================================
-- 9. Weekly Payout Summaries Table (دورات وملخصات القبض الأسبوعية)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS weekly_payout_summaries (
    week_period VARCHAR(30) PRIMARY KEY,           -- e.g. '2026-10-12' (ISO week start)
    week_label VARCHAR(150) NOT NULL,              -- e.g. 'Monday, October 12, 2026'
    date DATE NOT NULL,
    total_drivers INT DEFAULT 0,
    total_amount DECIMAL(15, 2) DEFAULT 0.00,
    total_operations INT DEFAULT 0,
    average_payout DECIMAL(12, 2) DEFAULT 0.00,
    management_total DECIMAL(15, 2) DEFAULT 0.00,  -- إجمالي الإدارة
    production_total DECIMAL(15, 2) DEFAULT 0.00,  -- إجمالي الإنتاج
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'locked')),
    locked_at TIMESTAMP,
    locked_by VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 10. Driver Payout Transactions Table (حركات وإيصالات قبض السائقين التفصيلية)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS driver_payout_transactions (
    id VARCHAR(50) PRIMARY KEY,
    driver_id VARCHAR(50) NOT NULL,
    driver_name VARCHAR(150) NOT NULL,
    week_period VARCHAR(30) NOT NULL,
    date DATE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    category VARCHAR(30) NOT NULL CHECK (category IN ('management', 'production')),
    description TEXT,
    vehicle_plate VARCHAR(50),
    status VARCHAR(20) DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'cancelled')),
    payment_method VARCHAR(30) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'transfer', 'cheque')),
    receipt_number VARCHAR(50),
    order_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payout_driver FOREIGN KEY (driver_id)
        REFERENCES drivers(id) ON DELETE CASCADE,
    CONSTRAINT fk_payout_week FOREIGN KEY (week_period)
        REFERENCES weekly_payout_summaries(week_period) ON DELETE CASCADE
);
CREATE INDEX idx_payout_week_period ON driver_payout_transactions(week_period);
CREATE INDEX idx_payout_driver_id ON driver_payout_transactions(driver_id);
