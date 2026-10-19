import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { mockDepartments } from '../src/mocks/departments';
import { mockPositions } from '../src/mocks/positions';
import { mockEmployees } from '../src/mocks/employees';
import { mockSocialInsuranceRecords, mockMissingDocumentRecords } from '../src/mocks/insurance';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const seedData = {
  departments: mockDepartments,
  positions: mockPositions,
  employees: mockEmployees,
  socialInsurance: mockSocialInsuranceRecords,
  missingDocuments: mockMissingDocumentRecords,
};

fs.writeFileSync(
  path.join(dbDir, 'seed_data.json'),
  JSON.stringify(seedData, null, 2),
  'utf-8'
);

// Helper to escape SQL string
const esc = (val: any) => {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  return `'${String(val).replace(/'/g, "''")}'`;
};

// Generate seed.sql
let sql = `-- ==============================================================================
-- HR System Seed Data
-- ==============================================================================

-- 1. Departments
INSERT INTO departments (id, code, name, name_ar, name_zh, manager_name, employee_count, location, budget) VALUES
`;

sql += mockDepartments.map(d => 
  `(${esc(d.id)}, ${esc(d.code)}, ${esc(d.name)}, ${esc(d.nameAr)}, ${esc(d.nameZh)}, ${esc(d.managerName)}, ${d.employeeCount}, ${esc(d.location)}, ${d.budget})`
).join(',\n') + ';\n\n';

// 2. Positions
sql += `-- 2. Positions
INSERT INTO positions (id, code, title, title_ar, title_zh, department_id, department_name, min_salary, max_salary, level) VALUES
`;

sql += mockPositions.map(p =>
  `(${esc(p.id)}, ${esc(p.code)}, ${esc(p.title)}, ${esc(p.titleAr)}, ${esc(p.titleZh)}, ${esc(p.departmentId)}, ${esc(p.departmentName)}, ${p.minSalary}, ${p.maxSalary}, ${esc(p.level)})`
).join(',\n') + ';\n\n';

// 3. Employees
sql += `-- 3. Employees (275 records including real workforce data)
INSERT INTO employees (
  id, employee_id, first_name, last_name, arabic_name, chinese_name, email, phone, avatar, national_id,
  date_of_birth, gender, nationality, address, department_id, department_name, position_id, position_title,
  chinese_position, employment_status, employment_type, hire_date, basic_salary, contract_status,
  insurance_status, insurance_number, insurance_salary, worker_share, company_share,
  qualification_certificate_status, birth_certificate_status, id_card_status, contract_doc_status, document_checklist_status
) VALUES
`;

sql += mockEmployees.map(e => 
  `(${esc(e.id)}, ${esc(e.employeeId)}, ${esc(e.firstName)}, ${esc(e.lastName)}, ${esc(e.arabicName)}, ${esc(e.chineseName)}, ${esc(e.email)}, ${esc(e.phone)}, ${esc(e.avatar)}, ${esc(e.nationalId)}, ${esc(e.dateOfBirth)}, ${esc(e.gender)}, ${esc(e.nationality)}, ${esc(e.address)}, ${esc(e.departmentId)}, ${esc(e.departmentName)}, ${esc(e.positionId)}, ${esc(e.positionTitle)}, ${esc(e.chinesePosition)}, ${esc(e.employmentStatus)}, ${esc(e.employmentType)}, ${esc(e.hireDate)}, ${e.basicSalary}, ${esc(e.contractStatus)}, ${esc(e.insuranceStatus)}, ${esc(e.insuranceNumber)}, ${esc(e.insuranceSalary || 4325.00)}, ${esc(e.workerShare || 475.85)}, ${esc(e.companyShare || 811.13)}, ${esc(e.qualificationCertificateStatus)}, ${esc(e.birthCertificateStatus)}, ${esc(e.idCardStatus)}, ${esc(e.contractDocStatus)}, ${esc(e.documentChecklistStatus)})`
).join(',\n') + ';\n\n';

// 4. Social Insurance
sql += `-- 4. Social Insurance (108 records with 76 Found and 32 Not Found alerts)
INSERT INTO social_insurance (
  id, serial_no, national_id, employee_name, department, insurance_number,
  insurance_salary, worker_share, company_share, total_contribution, note, employee_list_status, employee_code
) VALUES
`;

sql += mockSocialInsuranceRecords.map(s =>
  `(${esc(s.id)}, ${s.serialNo}, ${esc(s.nationalId)}, ${esc(s.employeeName)}, ${esc(s.department)}, ${esc(s.insuranceNumber)}, ${s.insuranceSalary}, ${s.workerShare}, ${s.companyShare}, ${s.totalContribution}, ${esc(s.note)}, ${esc(s.employeeListStatus)}, ${esc(s.employeeCode)})`
).join(',\n') + ';\n\n';

// 5. Missing Documents
sql += `-- 5. Employee Missing Documents
INSERT INTO employee_missing_documents (
  id, serial_no, department, employee_name, national_id, position,
  start_date, resignation_date, employee_code, insurance_status,
  qualification_cert, birth_cert, id_card, contract, missing_count, notes, status
) VALUES
`;

sql += mockMissingDocumentRecords.map(m =>
  `(${esc(m.id)}, ${m.serialNo}, ${esc(m.department)}, ${esc(m.employeeName)}, ${esc(m.nationalId)}, ${esc(m.position)}, ${esc(m.startDate)}, ${esc(m.resignationDate)}, ${esc(m.employeeCode)}, ${esc(m.insuranceStatus)}, ${esc(m.qualificationCert)}, ${esc(m.birthCert)}, ${esc(m.idCard)}, ${esc(m.contract)}, ${m.missingCount}, ${esc(m.notes)}, ${esc(m.status)})`
).join(',\n') + ';\n';

fs.writeFileSync(path.join(dbDir, 'seed.sql'), sql, 'utf-8');

console.log('Successfully generated seed.sql and seed_data.json!');
