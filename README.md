# 🚀 Enterprise HR Management System - Backend API

> **Production-grade Enterprise REST API** powered by **Node.js**, **TypeScript**, **Express**, **Prisma ORM**, and **SQLite / PostgreSQL**.  
> Designed for seamless integration with the Enterprise HR Workforce Platform frontend.

---

## 🏗️ Architecture & Technology Stack

- **Runtime & Language**: Node.js (v20+) with TypeScript (ES2022)
- **Framework**: Express.js
- **Database & ORM**: Prisma ORM with SQLite (zero-config local database: `prisma/dev.db`) or PostgreSQL
- **Validation**: Zod schema validation
- **File Handling**: Multer for uploaded document records
- **Security & CORS**: Permissive CORS enabled for `http://localhost:5173`
- **Logging**: Morgan HTTP request logging

---

## 📁 Project Structure

```
├── prisma/
│   ├── schema.prisma       # Prisma relational schema (7 models)
│   ├── seed.ts             # Database seeder populating workforce datasets
│   └── dev.db              # SQLite database file
├── src/
│   ├── config/
│   │   └── env.ts          # Strongly typed environment configuration
│   ├── db/
│   │   └── prisma.ts       # Singleton Prisma client
│   ├── middleware/
│   │   ├── errorHandler.ts # Centralized error & validation handling
│   │   ├── validate.ts     # Zod schema validation middleware
│   │   └── upload.ts       # Multer multipart file upload handling
│   ├── modules/
│   │   ├── departments/    # Departments CRUD & counts
│   │   ├── positions/      # Positions & bilingual job titles
│   │   ├── employees/      # Employee directory, filters, pagination, batch import, stats
│   │   ├── insurance/      # Social insurance reconciliation & missing documents checklist
│   │   ├── documents/      # Document records repository, verification & rejection workflow
│   │   └── contracts/      # Employee contracts & renewal tracking
│   ├── routes.ts           # Central API router (/api/*)
│   ├── app.ts              # Express app setup, middleware, static uploads
│   └── server.ts           # Server bootstrap and graceful shutdown
├── uploads/                # File storage directory
├── API_CONTRACT.md         # Full API specification & data dictionaries
├── package.json
└── tsconfig.json
```

---

## ⚡ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (`.env`)
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="file:./dev.db"
CORS_ORIGIN="http://localhost:5173"
```

### 3. Initialize & Seed Database
```bash
npx prisma db push
npm run seed
```

This seeds:
- **11 Departments** (Engineering, HR, Finance, Production, Commercial Sales, etc.)
- **45 Positions** with English, Arabic, and Chinese titles
- **275 Employees** with complete workforce profiles, national IDs, and insurance details
- **108 Social Insurance records** (76 matching found employees + 32 alert records)
- **197 Missing Documents tracking records**
- **300 Document records** (verified, under review, and rejected)
- **275 Employment contracts**

### 4. Run Development Server
```bash
npm run dev
```

The server starts at `http://localhost:5000`:
- **API Base**: `http://localhost:5000/api`
- **Health Check**: `http://localhost:5000/api/health`

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System health, uptime, and database metrics |
| `GET` | `/api/departments` | List all 11 departments with employee & position counts |
| `GET` | `/api/departments/:id` | Get single department |
| `POST` | `/api/departments` | Create new department |
| `GET` | `/api/positions` | List positions (optional `?departmentId=...`) |
| `POST` | `/api/positions` | Create position |
| `GET` | `/api/employees` | Paginated employee directory with full-text search & filters |
| `GET` | `/api/employees/:id` | Full employee profile with relations |
| `POST` | `/api/employees` | Create employee (with auto-calculated insurance shares) |
| `PUT` | `/api/employees/:id` | Update employee profile |
| `DELETE` | `/api/employees/:id` | Delete employee |
| `POST` | `/api/employees/import` | Batch Excel import |
| `GET` | `/api/employees/stats` | Employee distribution aggregations |
| `GET` | `/api/insurance/social` | Social insurance records (`?employeeListStatus=found\|not_found`) |
| `GET` | `/api/insurance/stats` | Insurance financial aggregates (wages, worker 11%, company 18.75%) |
| `POST` | `/api/insurance/social/import` | Batch import social insurance records |
| `GET` | `/api/insurance/missing-documents` | Missing hiring & insurance documents checklist |
| `PATCH` | `/api/insurance/missing-documents/:id` | Toggle document availability (`qualificationCert`, `birthCert`, `idCard`, `contract`) |
| `POST` | `/api/insurance/missing-documents/import` | Batch import missing documents checklist |
| `GET` | `/api/documents` | List uploaded document records |
| `POST` | `/api/documents` | Upload & register document (metadata or multipart file) |
| `POST` | `/api/documents/:id/verify` | Verify document with audit notes |
| `POST` | `/api/documents/:id/reject` | Reject document with reason |
| `GET` | `/api/contracts` | List employment contracts |
| `GET` | `/api/contracts/:id` | Contract details |
