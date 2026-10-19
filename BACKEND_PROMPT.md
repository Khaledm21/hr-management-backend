# 🚀 Prompt & Master Instructions to Build the Backend with Antigravity

> **طريقة الاستخدام**:  
> 1. افتح مجلد جديد للباك إند (مثلاً: `Desktop/HR-Backend`).  
> 2. افتح محادثة جديدة مع **Antigravity**.  
> 3. انسخ البرومبت الموجود في هذا الملف وأرسله له بالكامل.  
> 4. سيقوم Antigravity ببناء الباك إند بالكامل خطوة بخطوة وربط قاعدة البيانات واستيراد الـ 275 موظف وكافة بيانات التأمينات تلقائياً!

---

## 📋 البرومبت الجاهز للنسخ (Copy & Paste Prompt)

```markdown
You are a Senior Principal Backend Engineer and Software Architect specializing in enterprise systems (Node.js, TypeScript, Express/NestJS, Prisma ORM, and PostgreSQL/SQLite).

I have a completed, production-ready frontend for an Enterprise HR Management System running at `http://localhost:5173`. 
Now, I want you to build the COMPLETE BACKEND in this project directory to power it.

---

### 🎯 Primary Goal:
Build a robust, production-grade REST API backend running on `http://localhost:5000/api` with full CRUD, search, pagination, database seeding, file handling, and statistical aggregations for:
1. **Departments & Positions** (11 Departments, 37 Positions with Arabic & Chinese titles)
2. **Employees Directory** (275 employees, National ID verification, filters, pagination, batch Excel import)
3. **Social Insurance Reconciliation** (108 records, 76 matching, 32 not-found alerts, worker 11% & company 18.75% contributions)
4. **Missing Insurance & Hiring Documents** (Checklist for Qualification cert, Birth cert, ID card, Contract)
5. **Documents Management** (Verification, Rejection, Upload)

---

### 📂 Source Files & Contracts:
I have prepared the exact database schemas, contracts, and seed files in the frontend repository at:
`c:\Users\khaled mossad\Desktop\HR-Management-System\backend-starter\`

Please reference and copy:
1. **`API_CONTRACT.md`**: The complete API specification (routes, query params, request bodies, sample responses).
2. **`contracts/types.ts`**: The TypeScript DTOs and interfaces.
3. **`database/schema.sql`**: Full DDL schema (compatible with PostgreSQL and SQLite/MySQL).
4. **`database/seed_data.json`**: Complete structured JSON with all 275 employees, 11 departments, positions, 108 social insurance records, and missing documents.
5. **`database/seed.sql`**: Raw SQL inserts.

---

### 🛠️ Recommended Tech Stack:
- **Language**: TypeScript
- **Framework**: Express.js (or NestJS / Fastify)
- **ORM / Database**: Prisma ORM with SQLite (for instant local zero-config run) or PostgreSQL (configured via `.env`)
- **Validation**: Zod or Joi or class-validator
- **CORS**: `cors` package enabled for `http://localhost:5173` (Frontend)
- **Port**: `5000` (`http://localhost:5000/api`)

---

### 📋 Detailed Implementation Steps:

#### Step 1: Project Initialization & Dependencies
- Initialize `package.json` with TypeScript configuration (`tsconfig.json`).
- Install: `express`, `cors`, `dotenv`, `zod`, `morgan`, `@prisma/client`.
- Dev dependencies: `typescript`, `ts-node-dev` (or `tsx`), `@types/express`, `@types/cors`, `@types/node`, `prisma`.

#### Step 2: Database Modeling (Prisma Schema)
- Create `prisma/schema.prisma` with models mirroring `schema.sql`:
  - `Department`
  - `Position`
  - `Employee`
  - `SocialInsurance`
  - `EmployeeMissingDocument`
  - `DocumentRecord`
  - `Contract`
- Run `npx prisma db push` or migrations.

#### Step 3: Database Seeder
- Create `prisma/seed.ts` that loads `backend-starter/database/seed_data.json`.
- Populate all:
  - 11 Departments
  - 37 Positions
  - 275 Employees
  - 108 Social Insurance rows
  - Missing documents checklist
- Add `"prisma": { "seed": "ts-node prisma/seed.ts" }` in `package.json` and execute `npx prisma db seed`.

#### Step 4: Routing & Controllers (`/api/*`)
Implement clean Controller-Service architecture matching `API_CONTRACT.md`:
1. **Departments & Positions**:
   - `GET /api/departments`
   - `POST /api/departments`
   - `GET /api/positions` (optional `?departmentId=...`)
2. **Employees**:
   - `GET /api/employees` (support `page`, `pageSize`, `search`, `departmentId`, `employmentStatus`, `insuranceStatus`, `documentStatus`, `sortBy`, `sortDirection`)
   - `GET /api/employees/:id`
   - `POST /api/employees` (create with validation)
   - `PUT /api/employees/:id` (update)
   - `DELETE /api/employees/:id`
   - `POST /api/employees/import` (batch import from excel payload)
   - `GET /api/employees/stats` (counts by department, status, insurance)
3. **Social Insurance**:
   - `GET /api/insurance/social` (support `search`, `department`, `employeeListStatus=found|not_found|all`)
   - `GET /api/insurance/stats` (total wage 467,100 EGP, worker share 51,381 EGP, company share 87,581.25 EGP)
4. **Missing Documents**:
   - `GET /api/insurance/missing-documents` (support `search`, `department`, `status`, `missingDoc`)
   - `PATCH /api/insurance/missing-documents/:id` (toggle missing/available status)
5. **Documents**:
   - `GET /api/documents`
   - `POST /api/documents` (upload metadata)
   - `POST /api/documents/:id/verify`
   - `POST /api/documents/:id/reject`

#### Step 5: Middleware & Error Handling
- Global CORS configured with `origin: ['http://localhost:5173']` and credentials support.
- JSON body parser (`express.json({ limit: '10mb' })`).
- Centralized error handling middleware returning `{ success: false, message: string }`.
- Request logger (morgan or simple middleware).

#### Step 6: Verification
- Start dev server with `npm run dev` on port `5000`.
- Test key endpoints using curl / fetch to verify correct response formats matching `API_CONTRACT.md`.
```

---

## 🔗 كيف تربط الفرونت إند بالباك إند بعد تشغيله؟

بمجرد تشغيل الباك إند على المنفذ `5000`:
1. اذهب لملف [`.env`](file:///c:/Users/khaled%20mossad/Desktop/HR-Management-System/.env) في مشروع الفرونت إند الحالي.
2. غيّر قيمة `VITE_USE_MOCK` من `true` إلى `false`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_USE_MOCK=false
   ```
3. افتح المتصفح على `http://localhost:5173`، ستجد الفرونت إند فوراً يرسل ويستقبل البيانات الحقيقية من قاعدة بيانات الباك إند!
