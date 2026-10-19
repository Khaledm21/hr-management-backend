# 🚀 Enterprise HR Management System - Backend API Specification & Contract
> **Comprehensive API Reference, Database Schema Guide, and Data Dictionaries**  
> *Prepared for backend implementation (Node.js/Express/NestJS, Python/FastAPI/Django, Go, PHP/Laravel, Java/Spring Boot)*

---

## 📑 Table of Contents
1. [Overview & Base Setup](#1-overview--base-setup)
2. [Database Schema Summary & Tables](#2-database-schema-summary--tables)
3. [Seeding the Database (SQL vs JSON)](#3-seeding-the-database)
4. [Authentication & Global Headers](#4-authentication--global-headers)
5. [Departments & Positions Endpoints (`/api/departments`, `/api/positions`)](#5-departments--positions-endpoints)
6. [Employees Endpoints (`/api/employees`)](#6-employees-endpoints)
7. [Social Insurance Reconciliation Endpoints (`/api/insurance/social`)](#7-social-insurance-reconciliation-endpoints)
8. [Insurance & Hiring Missing Documents Endpoints (`/api/insurance/missing-documents`)](#8-missing-documents-endpoints)
9. [Document Management & Verification Endpoints (`/api/documents`)](#9-document-management-endpoints)
10. [Frontend Client Integration & Switch Instructions](#10-frontend-client-integration)
11. [Drivers & Driver Payouts Endpoints (`/api/drivers`, `/api/driver-payouts`)](#11-drivers--driver-payouts-endpoints)

---

## 1. Overview & Base Setup

- **Default Base URL**: `http://localhost:5000/api`
- **Frontend Environment Variables** (in `.env`):
  ```env
  VITE_API_URL=http://localhost:5000/api
  VITE_USE_MOCK=false # Set to false to switch frontend from mock to your live backend!
  ```
- **Standard Response Format**:
  ```json
  {
    "success": true,
    "data": { ... },
    "message": "Optional status message"
  }
  ```
- **Standard Paginated Format**:
  ```json
  {
    "success": true,
    "data": [ ... ],
    "total": 275,
    "page": 1,
    "pageSize": 20,
    "totalPages": 14
  }
  ```

---

## 2. Database Schema Summary & Tables

The schema is defined in [`backend-starter/database/schema.sql`](./database/schema.sql). Compatible with **PostgreSQL 14+** and **MySQL 8.0+ / MariaDB**.

### Primary Tables:
1. `departments`: 11 organizational departments (Production, Quality, HR, Finance, Maintenance, etc.) with trilingual names (`name`, `name_ar`, `name_zh`).
2. `positions`: Bilingual Job Titles (`title`, `title_ar`, `title_zh` e.g., `主管1 - Supervisor 1`, `技术员 - Technician`).
3. `employees`: 275 core employees with complete personal, employment, and salary fields.
4. `social_insurance`: 108 insurance records with reconciliation status (`found` vs `not_found`), insurance wage, and computed shares (worker 11%, company 18.75%).
5. `employee_missing_documents`: Tracking for 4 critical Egyptian hiring/insurance documents:
   - المؤهل الدراسي (Qualification Certificate)
   - شهادة الميلاد (Birth Certificate)
   - بطاقة الرقم القومي (ID Card)
   - عقد العمل (Employment Contract)
6. `document_records`: Uploaded files with verification workflow (`verified`, `under_review`, `rejected`).
7. `contracts`: Formal employment contracts with dates and renewal alerts.

---

## 3. Seeding the Database

### Option A: Direct SQL Import (PostgreSQL / MySQL CLI)
Execute the provided script in terminal:
```bash
# PostgreSQL
psql -U your_username -d hr_db -f backend-starter/database/schema.sql
psql -U your_username -d hr_db -f backend-starter/database/seed.sql

# MySQL
mysql -u your_username -p hr_db < backend-starter/database/schema.sql
mysql -u your_username -p hr_db < backend-starter/database/seed.sql
```

### Option B: Structured JSON Seed (Prisma, TypeORM, Mongoose, Sequelize, Django, Laravel)
Use [`backend-starter/database/seed_data.json`](./database/seed_data.json) which contains ready-to-insert JSON arrays:
- `seed_data.departments` (11 records)
- `seed_data.positions` (37 records)
- `seed_data.employees` (275 records)
- `seed_data.social_insurance` (108 records)
- `seed_data.employee_missing_documents` (68 records)

---

## 4. Authentication & Global Headers

All requests sent by `apiClient.ts` automatically attach:
```http
Authorization: Bearer <TOKEN_FROM_LOCALSTORAGE_OR_AUTH_STATE>
Content-Type: application/json
Accept: application/json
```

---

## 5. Departments & Positions Endpoints

### 5.1. List All Departments
- **`GET /api/departments`**
- **Query Params**: None (or optional `search`)
- **Response `200 OK`**:
```json
[
  {
    "id": "dept-1",
    "code": "PROD",
    "name": "Production Department",
    "nameAr": "إدارة الإنتاج",
    "nameZh": "生产部",
    "managerId": "EMP-001",
    "employeeCount": 185
  },
  {
    "id": "dept-2",
    "code": "QC",
    "name": "Quality Control Department",
    "nameAr": "إدارة الجودة",
    "nameZh": "品管部",
    "managerId": "EMP-045",
    "employeeCount": 24
  }
]
```

### 5.2. Create Department
- **`POST /api/departments`**
- **Body**:
```json
{
  "code": "SCM",
  "name": "Supply Chain & Logistics",
  "nameAr": "سلاسل الإمداد واللوجستيات",
  "nameZh": "供应链与物流部"
}
```

### 5.3. List Positions
- **`GET /api/positions`**
- **Query Params**: `departmentId` (optional)
- **Response `200 OK`**:
```json
[
  {
    "id": "pos-prod-1",
    "code": "SUP-1",
    "title": "Supervisor 1",
    "titleAr": "مشرف 1",
    "titleZh": "主管1",
    "departmentId": "dept-1"
  },
  {
    "id": "pos-prod-2",
    "code": "TECH",
    "title": "Technician",
    "titleAr": "فني",
    "titleZh": "技术员",
    "departmentId": "dept-1"
  }
]
```

---

## 6. Employees Endpoints

### 6.1. Get Paginated Employees
- **`GET /api/employees`**
- **Query Parameters**:
  - `page`: number (default: 1)
  - `pageSize`: number (default: 20)
  - `search`: string (matches code, name, phone, national ID, or position)
  - `departmentId`: string (filter by department ID or code)
  - `employmentStatus`: `active` | `probation` | `terminated` | `on_leave`
  - `insuranceStatus`: `insured` | `not_insured` | `all`
  - `documentStatus`: `complete` | `incomplete` | `all`
  - `sortBy`: `employeeId` | `firstName` | `hireDate` | `basicSalary`
  - `sortDirection`: `asc` | `desc`
- **Response `200 OK`**:
```json
{
  "data": [
    {
      "id": "EMP-001",
      "employeeId": "EMP-001",
      "firstName": "أحمد",
      "lastName": "محمد إبراهيم",
      "arabicName": "أحمد محمد إبراهيم",
      "chineseName": "艾哈迈德",
      "email": "ahmed.mohamed@company.com",
      "phone": "01012345678",
      "nationalId": "29504120101234",
      "departmentId": "dept-1",
      "positionId": "pos-prod-1",
      "chinesePosition": "主管1",
      "employmentStatus": "active",
      "employmentType": "full_time",
      "hireDate": "2022-03-15",
      "basicSalary": 8500,
      "housingAllowance": 1200,
      "transportAllowance": 800,
      "insuranceStatus": "insured",
      "insuranceNumber": "32145698",
      "insuranceSalary": 4325,
      "documentCompletenessPercentage": 100,
      "missingDocumentsCount": 0
    }
  ],
  "total": 275,
  "page": 1,
  "pageSize": 20,
  "totalPages": 14
}
```

### 6.2. Get Single Employee by ID
- **`GET /api/employees/:id`**
- **Response `200 OK`**: Full employee object including relations (department, position, contracts, insurance record, uploaded documents).

### 6.3. Create Employee
- **`POST /api/employees`**
- **Body**: `CreateEmployeeDto`
```json
{
  "employeeId": "EMP-276",
  "firstName": "محمود",
  "lastName": "عادل حسن",
  "arabicName": "محمود عادل حسن",
  "email": "mahmoud.adel@company.com",
  "phone": "01099887766",
  "nationalId": "29805151204567",
  "gender": "male",
  "departmentId": "dept-1",
  "positionId": "pos-prod-2",
  "chinesePosition": "技术员",
  "employmentStatus": "probation",
  "hireDate": "2026-10-10",
  "basicSalary": 6000,
  "insuranceStatus": "not_insured"
}
```

### 6.4. Update Employee
- **`PUT /api/employees/:id`**
- **Body**: Partial `UpdateEmployeeDto`

### 6.5. Batch Excel Import
- **`POST /api/employees/import`**
- **Body**:
```json
{
  "records": [
    {
      "employeeId": "EMP-277",
      "arabicName": "سارة طارق",
      "nationalId": "29901010105432",
      "department": "Quality",
      "position": "QC Inspector",
      "hireDate": "2026-10-01"
    }
  ]
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "insertedCount": 1,
  "skippedCount": 0,
  "errors": []
}
```

---

## 7. Social Insurance Reconciliation Endpoints

### 7.1. List Social Insurance Records
- **`GET /api/insurance/social`**
- **Query Parameters**:
  - `search`: string (matches nationalId, employeeName, or insuranceNumber)
  - `department`: string
  - `employeeListStatus`: `found` | `not_found` | `all`
- **Response `200 OK`**:
```json
[
  {
    "id": "soc-ins-1",
    "serialNo": 1,
    "nationalId": "29501010101111",
    "employeeName": "أحمد محمود سالم",
    "department": "Production",
    "insuranceNumber": "87654321",
    "insuranceSalary": 4325.00,
    "workerShare": 475.75,
    "companyShare": 810.94,
    "employeeListStatus": "found",
    "employeeCode": "EMP-001",
    "note": "مطابق لكشف التأمينات"
  },
  {
    "id": "soc-ins-77",
    "serialNo": 77,
    "nationalId": "29805050502222",
    "employeeName": "إسلام عبد الرحمن",
    "department": "Logistics",
    "insuranceNumber": "99887766",
    "insuranceSalary": 4325.00,
    "workerShare": 475.75,
    "companyShare": 810.94,
    "employeeListStatus": "not_found",
    "employeeCode": null,
    "note": "غير موجود في شيت الموظفين الحالي"
  }
]
```

### 7.2. Social Insurance Summary Stats
- **`GET /api/insurance/stats`**
- **Response `200 OK`**:
```json
{
  "totalRecords": 108,
  "foundCount": 76,
  "notFoundCount": 32,
  "totalInsuranceWage": 467100.00,
  "totalWorkerContributions": 51381.00,
  "totalCompanyContributions": 87581.25,
  "standardWage": 4325.00,
  "workerRate": 0.11,
  "companyRate": 0.1875
}
```

---

## 8. Missing Documents Endpoints

### 8.1. List Missing Documents Records
- **`GET /api/insurance/missing-documents`**
- **Query Parameters**:
  - `search`: string (search by name or employee code)
  - `department`: string
  - `status`: `incomplete` | `complete` | `all`
  - `missingDoc`: `qualification` | `birth` | `idCard` | `contract` | `all`
- **Response `200 OK`**:
```json
[
  {
    "id": "doc-req-1",
    "employeeCode": "EMP-012",
    "employeeName": "خالد إبراهيم الدسوقي",
    "department": "Maintenance",
    "qualificationCert": false,
    "birthCert": true,
    "idCard": true,
    "contract": false,
    "missingCount": 2,
    "notes": "مطلوب إحضار أصل المؤهل وتوقيع العقد"
  }
]
```

### 8.2. Toggle Document Status
- **`PATCH /api/insurance/missing-documents/:id`**
- **Body**:
```json
{
  "documentType": "qualificationCert",
  "status": "available"
}
```
- **Response `200 OK`**: Updated document checklist record.

---

## 9. Document Management Endpoints

### 9.1. List Uploaded Documents
- **`GET /api/documents`**
- **Query Params**: `employeeId`, `department`, `type`, `status` (`verified` | `under_review` | `rejected`)

### 9.2. Verify Document
- **`POST /api/documents/:id/verify`**
- **Body**:
```json
{
  "notes": "تمت مراجعة أصل المستند ومطابقته"
}
```

### 9.3. Reject Document
- **`POST /api/documents/:id/reject`**
- **Body**:
```json
{
  "rejectionReason": "صورة البطاقة غير واضحة أو منتهية الصلاحية"
}
```

---

## 10. Frontend Client Integration & Switch Instructions

The frontend services in `src/services/` (`employeeService.ts`, `insuranceService.ts`, `departmentService.ts`, `documentService.ts`) are **already wired** to `apiClient.ts` with an intelligent fallback!

### To run with your real backend:
1. Open `.env` in the root directory.
2. Set `VITE_USE_MOCK=false`.
3. Set `VITE_API_URL=http://localhost:5000/api` (or your backend port).
4. Start your backend server.
5. Reload the frontend — it will immediately start fetching and mutating real database records!
6. If the backend server ever stops or crashes, the frontend **automatically and gracefully falls back** to the offline data, preventing screen crashes.

---

## 11. Drivers & Driver Payouts Endpoints

### 11.1. Drivers Fleet (`/api/drivers`)
- **`GET /api/drivers`**: List all drivers (supports `?search=...&status=active&category=production`).
- **`GET /api/drivers/:id`**: Single driver details with associated transactions.
- **`POST /api/drivers`**: Create driver profile (auto-generates sequential code `DRV-01`, `DRV-02`, ...).
  ```json
  {
    "name": "احمد فريد",
    "phone": "01012345671",
    "nationalId": "28801011234567",
    "vehicleNumber": "أ ب ج 1122",
    "vehicleType": "جامبو 7000",
    "defaultCategory": "management",
    "status": "active",
    "notes": "سائق مأموريات الإدارة العليا"
  }
  ```
- **`PUT /api/drivers/:id`**: Update driver profile.
- **`DELETE /api/drivers/:id`**: Delete driver.

### 11.2. Weekly Summaries (`/api/driver-payouts/summaries`)
- **`GET /api/driver-payouts/summaries`**: List all weekly periods with financial aggregations.
- **`GET /api/driver-payouts/summaries/:weekPeriod`**: Summary details for a specific week period (e.g. `2026-10-12`).
- **`POST /api/driver-payouts/summaries`**: Initialize a new weekly cycle period.
  ```json
  {
    "weekPeriod": "2026-10-19",
    "weekLabel": "أسبوع 19 أكتوبر 2026",
    "date": "2026-10-19"
  }
  ```
- **`PUT /api/driver-payouts/summaries/:weekPeriod/status`**: Lock or unlock a weekly cycle period.
  ```json
  {
    "status": "locked",
    "lockedBy": "المدير المالي"
  }
  ```

### 11.3. Payout Transactions (`/api/driver-payouts/transactions`)
- **`GET /api/driver-payouts/transactions?weekPeriod=2026-10-12&driverId=...&category=...&search=...`**: Filtered list of trips and payments.
- **`POST /api/driver-payouts/transactions`**: Record trip payout (auto-generates receipt number `REC-YYMM-XXX`, calculates `orderIndex`, and auto-recalculates weekly summary aggregations).
  ```json
  {
    "driverId": "drv-1",
    "weekPeriod": "2026-10-12",
    "date": "2026-10-12",
    "amount": 2700,
    "category": "management",
    "description": "مأموريات إدارة عامة وانتقالات رسمية",
    "vehiclePlate": "أ ب ج 1122",
    "paymentMethod": "cash",
    "status": "paid"
  }
  ```
- **`PUT /api/driver-payouts/transactions/:id`**: Update transaction details and re-aggregate weekly summary.
- **`DELETE /api/driver-payouts/transactions/:id`**: Delete transaction and re-aggregate weekly summary.

### 11.4. Weekly Matrix Representation (`/api/driver-payouts/matrix/:weekPeriod`)
- **`GET /api/driver-payouts/matrix/:weekPeriod`**: Returns full aggregated spreadsheet-like matrix representation (`{ columns, maxRows, summary }`) for Excel grid viewing.

### 11.5. Batch Excel Import (`/api/driver-payouts/batch-import`)
- **`POST /api/driver-payouts/batch-import`**: Atomically imports drivers and their weekly trips from an uploaded Excel sheet.
  - Automatically creates new drivers if they don't exist yet (assigning sequential code `DRV-XX`).
  - Automatically ensures the weekly cycle exists.
  - Calculates `orderIndex` per driver and auto-generates receipt numbers `REC-YYMM-XXX`.
  - Recalculates all weekly totals (`totalAmount`, `managementTotal`, `productionTotal`, `totalDrivers`, `totalOperations`, `averagePayout`).
  ```json
  {
    "weekPeriod": "2026-10-12",
    "weekLabel": "Monday, October 12, 2026",
    "drivers": [
      { "name": "أحمد فريد", "vehicleType": "ميكروباص", "defaultCategory": "production" }
    ],
    "transactions": [
      { "driverName": "أحمد فريد", "amount": 2700, "category": "production", "date": "2026-10-12" }
    ]
  }
  ```
  - **Response**:
  ```json
  {
    "success": true,
    "data": {
      "importedDriversCount": 14,
      "importedTransactionsCount": 32
    },
    "importedDriversCount": 14,
    "importedTransactionsCount": 32,
    "message": "تم استيراد بيانات السائقين والعمليات بنجاح"
  }
  ```
