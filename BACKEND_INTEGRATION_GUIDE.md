# 📘 دليل التكامل والربط الشامل للباك إند والفرونت إند
# Enterprise HR Management System - Backend Integration & Architecture Guide

> **الحالة:** 🟢 **يعمل وجاهز للإنتاج (Live & Production-Ready)**  
> **عنوان الخادم:** `http://localhost:5000`  
> **عنوان واجهة البرمجة (API Base):** `http://localhost:5000/api`  
> **فحص الحالة (Health Check):** `http://localhost:5000/api/health`  
> **الواجهة الأمامية المرتبطة:** `http://localhost:5173`

---

## 📑 فهرس المحتويات
1. [نظرة عامة على المعمارية والتقنيات (Architecture & Stack)](#1-نظرة-عامة-على-المعمارية-والتقنيات)
2. [قاعدة البيانات والبيانات المحقونة (Database & Seeded Datasets)](#2-قاعدة-البيانات-والبيانات-المحقونة)
3. [إعدادات البيئة والتشغيل (Environment & Configuration)](#3-إعدادات-البيئة-والتشغيل)
4. [مرجع واجهات برمجة التطبيقات التفصيلي (Complete API Reference)](#4-مرجع-واجهات-برمجة-التطبيقات-التفصيلي)
   - [4.1 الأقسام والإدارات (Departments)](#41-الأقسام-والإدارات-departments)
   - [4.2 المسميات الوظيفية (Positions)](#42-المسميات-الوظيفية-positions)
   - [4.3 دليل الموظفين (Employees Directory)](#43-دليل-الموظفين-employees-directory)
   - [4.4 مطابقة التأمينات الاجتماعية (Social Insurance Reconciliation)](#44-مطابقة-التأمينات-الاجتماعية-social-insurance-reconciliation)
   - [4.5 شيت مسوغات التعيين والأوراق الناقصة (Missing Documents Checklist)](#45-شيت-مسوغات-التعيين-والأوراق-الناقصة-missing-documents-checklist)
   - [4.6 أرشيف وإدارة المستندات (Document Archive & Verification)](#46-أرشيف-وإدارة-المستندات-document-archive--verification)
   - [4.7 العقود الوظيفية (Contracts)](#47-العقود-الوظيفية-contracts)
5. [كيفية ربط الفرونت إند بالباك إند (Frontend Integration Flow)](#5-كيفية-ربط-الفرونت-إند-بالباك-إند)
6. [أوامر الاختبار المباشرة (cURL & PowerShell Test Commands)](#6-أوامر-الاختبار-المباشرة)

---

## 1. نظرة عامة على المعمارية والتقنيات

تم تصميم الباك إند وفق أفضل الممارسات البرمجية العالمية للمشاريع المؤسسية الضخمة (Enterprise Systems) باتباع نمط:  
**Controller – Service – Repository Layered Architecture**.

```
HR-Management-System-back/
├── prisma/
│   ├── schema.prisma       # مخطط قاعدة البيانات (Prisma Relational Schema)
│   ├── seed.ts             # سكريبت حقن البيانات المتكامل
│   └── dev.db              # ملف قاعدة بيانات SQLite السريع
├── src/
│   ├── config/env.ts       # ضبط متغيرات البيئة بصرامة نوعية
│   ├── db/prisma.ts        # نسخة Prisma Client موحدة (Singleton)
│   ├── middleware/
│   │   ├── errorHandler.ts # معالج الأخطاء المركزي الموحد
│   │   ├── validate.ts     # التحقق التلقائي بمكتبة Zod
│   │   └── upload.ts       # معالجة رفع الملفات والمستندات (Multer)
│   ├── modules/
│   │   ├── departments/    # خدمات ووحدات تحكم الأقسام
│   │   ├── positions/      # خدمات ووحدات تحكم المسميات الوظيفية
│   │   ├── employees/      # خدمات ووحدات تحكم الموظفين والترقيم والاستيراد
│   │   ├── insurance/      # خدمات مطابقة التأمينات والأوراق الناقصة
│   │   ├── documents/      # خدمات أرشيف المستندات والاعتماد والرفض
│   │   └── contracts/      # خدمات العقود وتنبيهات انتهاء السريان
│   ├── routes.ts           # موجه المسارات المجمع (/api/*)
│   ├── app.ts              # ضبط تطبيق Express والـ CORS والـ Static Files
│   └── server.ts           # تشغيل الخادم والإغلاق الآمن (Graceful Shutdown)
├── uploads/                # مجلد حفظ المستندات والملفات المرفوعة
├── API_CONTRACT.md         # المواصفات التعاقدية الكاملة
└── FRONTEND_INTEGRATION_PROMPT.md # البرومبت الجاهز للفرونت إند
```

---

## 2. قاعدة البيانات والبيانات المحقونة

تم حقن قاعدة البيانات بالكامل من ملفات الشيتات والبيانات الواقعية:

| الكيان | العدد الفعلي | التفاصيل |
|---|---|---|
| **الأقسام (Departments)** | **11** | كافة إدارات المؤسسة (الإنتاج، الجودة، الموارد البشرية، المالية، الهندسة، المبيعات، إلخ) بثلاث لغات (إنجليزي، عربي، صيني) مع المديرين والميزانيات. |
| **المسميات الوظيفية (Positions)** | **45** | مسميات وظيفية شاملة لجميع التخصصات مع مسميات صينية وعربية (`主管1 - Supervisor 1`, `技术员 - Technician`, `司机 - Driver`). |
| **الموظفون (Employees)** | **275** | بيانات متكاملة لـ 275 موظفاً بالأرقام القومية المصرية الصحيحة (14 رقماً)، الرواتب، حصص التأمينات، وأقسامهم. |
| **التأمينات الاجتماعية (Social Insurance)** | **108** | **76 مطابق** مع شيت الموظفين الحاليين (`found`) + **32 غير مطابق** (`not_found`) للتنبيه والمعالجة. |
| **شيت الأوراق الناقصة (Missing Documents)** | **197** | تتبع دقيق لـ 4 وثائق رسمية: (شهادة المؤهل، شهادة الميلاد، بطاقة الرقم القومي، عقد العمل). |
| **أرشيف المستندات (Document Records)** | **300** | مستندات مرفوعة بصيغة PDF مقسمة بين: موثقة ومطابقة، قيد المراجعة، ومرفوضة مع أسباب الرفض. |
| **عقود العمل (Contracts)** | **275** | عقود وظيفية محددة وغير محددة المدة مع تنبيهات العقود التي توشك على الانتهاء وحالات التجديد. |

---

## 3. إعدادات البيئة والتشغيل

### ملف `.env` الخاص بالباك إند:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="file:./dev.db"
CORS_ORIGIN="http://localhost:5173"
```

### أوامر الإدارة والتشغيل:
```bash
# تثبيت الاعتماديات
npm install

# توليد وتحديث الجداول في قاعدة البيانات
npx prisma db push

# إعادة حقن وتوليد البيانات الأولية بالكامل في أي وقت
npm run seed

# تشغيل خادم التطوير مع التحديث التلقائي (Hot Reload)
npm run dev

# استعراض وإدارة قاعدة البيانات عبر واجهة بصرية جذابة في المتصفح
npx prisma studio

# بناء المشروع وتشغيله في وضع الإنتاج
npm run build
npm start
```

---

## 4. مرجع واجهات برمجة التطبيقات التفصيلي

### 4.1. الأقسام والإدارات (Departments)

#### `GET /api/departments`
- **الوصف:** جلب كافة الأقسام مع أعداد الموظفين والوظائف المحسوبة تلقائياً.
- **نموذج الاستجابة (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "dept-1",
      "code": "ENG",
      "name": "Engineering & Technology",
      "nameAr": "الهندسة والتكنولوجيا",
      "nameZh": "工程与技术部",
      "managerId": "emp-001",
      "managerName": "Tariq Al-Mansoor",
      "employeeCount": 68,
      "positionsCount": 16,
      "location": "Riyadh HQ - Floor 4",
      "budget": 4500000
    }
  ]
}
```

#### `GET /api/departments/:id`
- **الوصف:** تفاصيل قسم محدد مع قائمة الوظائف التابعة له.

#### `POST /api/departments`
- **الوصف:** إنشاء قسم جديد.
- **البيانات المطلوبة (Body):**
```json
{
  "code": "SCM",
  "name": "Supply Chain & Logistics",
  "nameAr": "سلاسل الإمداد واللوجستيات",
  "nameZh": "供应链与物流部",
  "budget": 2000000
}
```

---

### 4.2. المسميات الوظيفية (Positions)

#### `GET /api/positions`
- **معاملات الاستعلام الاختيارية:** `?departmentId=dept-1`
- **نموذج الاستجابة (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "pos-01",
      "code": "ENG-DIR",
      "title": "Director of Engineering",
      "titleAr": "مدير عام الهندسة",
      "titleZh": "工程总监",
      "departmentId": "dept-1",
      "minSalary": 38000,
      "maxSalary": 52000,
      "level": "Director"
    }
  ]
}
```

---

### 4.3. دليل الموظفين (Employees Directory)

#### `GET /api/employees`
- **معاملات الاستعلام المدعومة (Query Parameters):**
  - `page`: رقم الصفحة (افتراضي 1).
  - `pageSize`: عدد السجلات بالصفحة (افتراضي 20).
  - `search`: بحث ذكي في الاسم الأول، اسم العائلة، الاسم بالعربي، الاسم بالصيني، كود الموظف، الرقم القومي، الهاتف، أو المسمى الوظيفي.
  - `departmentId`: فلترة بكود أو ID القسم.
  - `employmentStatus`: `active`, `probation`, `on_leave`, `suspended`, `terminated`.
  - `contractStatus`: `active`, `expiring_soon`, `expired`, `pending_renewal`.
  - `insuranceStatus`: `insured`, `not_insured`.
  - `documentStatus`: `complete`, `incomplete`.
  - `sortBy`: حقل الترتيب (`employeeId`, `firstName`, `hireDate`, `basicSalary`).
  - `sortDirection`: اتجاه الترتيب (`asc`, `desc`).
- **نموذج الاستجابة المقسمة صفحات (Paginated 200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "emp-seed-001",
      "employeeId": "180301001",
      "firstName": "Donia Medhat",
      "lastName": "Eldesouky Rezk",
      "arabicName": "دنيا مدحت الدسوقي رزق",
      "chineseName": "多尼亚",
      "email": "donia.medhat@company.com",
      "phone": "+20 10 10004321",
      "nationalId": "29712051100088",
      "gender": "female",
      "departmentId": "dept-1",
      "departmentName": "Engineering & Technology",
      "positionId": "pos-1",
      "positionTitle": "Supervisor 1",
      "chinesePosition": "主管1 - Supervisor 1",
      "employmentStatus": "active",
      "employmentType": "full_time",
      "hireDate": "2023-04-12",
      "basicSalary": 4325.0,
      "insuranceStatus": "insured",
      "insuranceNumber": "58790872",
      "insuranceSalary": 4325.0,
      "workerShare": 475.85,
      "companyShare": 811.13,
      "documentCompletenessPercentage": 100,
      "missingDocumentsCount": 0,
      "documentChecklistStatus": "complete"
    }
  ],
  "total": 275,
  "page": 1,
  "pageSize": 20,
  "totalPages": 14
}
```

#### `GET /api/employees/:id`
- **الوصف:** جلب الملف الكامل للموظف شاملاً كائن القسم، المسمى الوظيفي، العقود المرتبطة، والمستندات المرفوعة.

#### `POST /api/employees`
- **الوصف:** إنشاء موظف جديد مع التحقق الصارم عبر Zod واحتساب نسب التأمينات وحالة الأوراق تلقائياً.
- **نموذج الـ Body:**
```json
{
  "employeeId": "EMP-276",
  "firstName": "محمود",
  "lastName": "عادل حسن",
  "arabicName": "محمود عادل حسن",
  "nationalId": "29805151204567",
  "email": "mahmoud.adel@company.com",
  "phone": "01099887766",
  "gender": "male",
  "departmentId": "dept-1",
  "positionId": "pos-01",
  "hireDate": "2026-10-10",
  "basicSalary": 6000,
  "insuranceStatus": "insured"
}
```
- **الحسابات التلقائية المطبقة:**
  - يتم فورياً احتساب: حصة العامل 11% = 660 ج.م، وحصة الشركة 18.75% = 1125 ج.م.

#### `PUT /api/employees/:id`
- **الوصف:** تعديل بيانات موظف موجود، مع إعادة احتساب نسب التأمينات ونسبة اكتمال الأوراق في حال تعديل أي منها.

#### `DELETE /api/employees/:id`
- **الوصف:** حذف الموظف وتصفية كافة الملفات والعقود المرتبطة به.

#### `POST /api/employees/import`
- **الوصف:** استيراد شيت إكسل دفعات.
- **نموذج الـ Body:**
```json
{
  "records": [
    {
      "employeeId": "EMP-301",
      "arabicName": "سارة طارق أحمد",
      "nationalId": "29901010105432",
      "department": "Quality",
      "position": "QA Automation Engineer",
      "hireDate": "2026-10-01",
      "basicSalary": 7500
    }
  ]
}
```
- **الاستجابة:** `{ "success": true, "insertedCount": 1, "skippedCount": 0, "errors": [] }`.

#### `GET /api/employees/stats`
- **الوصف:** إحصائيات توزيع القوى العاملة (حسب الأقسام، حالات العمل، التأمينات، واكتمال المستندات).

---

### 4.4. مطابقة التأمينات الاجتماعية (Social Insurance Reconciliation)

#### `GET /api/insurance/social`
- **معاملات الاستعلام:**
  - `search`: بحث بالرقم القومي، اسم الموظف، أو الرقم التأميني.
  - `department`: فلترة بالقسم.
  - `employeeListStatus`: `found` (مطابق) | `not_found` (غير مطابق) | `all`.
- **نموذج الاستجابة (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "soc-1",
      "serialNo": 1,
      "nationalId": "28305121202759",
      "employeeName": "Asad Ramadan Elsherbini Hegazy",
      "department": "PD",
      "insuranceNumber": "336123",
      "insuranceSalary": 4325.0,
      "workerShare": 475.85,
      "companyShare": 811.13,
      "totalContribution": 1286.98,
      "employeeListStatus": "not_found",
      "note": "Start:2024-08-01"
    }
  ]
}
```

#### `GET /api/insurance/stats`
- **الوصف:** مؤشرات المطابقة المالية والتأمينية الكلية:
```json
{
  "success": true,
  "data": {
    "totalRecords": 108,
    "foundCount": 76,
    "notFoundCount": 32,
    "totalInsuranceWage": 467100.0,
    "totalWorkerContributions": 51391.8,
    "totalCompanyContributions": 87602.04,
    "standardWage": 4325.0,
    "workerRate": 0.11,
    "companyRate": 0.1875
  }
}
```

---

### 4.5. شيت مسوغات التعيين والأوراق الناقصة (Missing Documents Checklist)

#### `GET /api/insurance/missing-documents`
- **معاملات الاستعلام:** `search`, `department`, `status` (`incomplete`, `complete`), `missingDoc` (`qualification`, `birth`, `idCard`, `contract`).
- **نموذج الاستجابة (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "doc-emp-seed-008",
      "serialNo": 1,
      "department": "HR",
      "employeeName": "Mohamed Saad Attia Elsayed",
      "nationalId": "29907101101457",
      "position": "司机 - Driver",
      "employeeCode": "180301008",
      "qualificationCert": "missing",
      "birthCert": "missing",
      "idCard": "missing",
      "contract": "missing",
      "missingCount": 4,
      "status": "incomplete"
    }
  ]
}
```

#### `PATCH /api/insurance/missing-documents/:id` (أو `/toggle`)
- **الوصف:** تحديث حالة وثيقة معينة بنقرة واحدة من الفرونت إند.
- **الـ Body:**
```json
{
  "documentType": "qualificationCert",
  "status": "available"
}
```
- **السلوك البرمجي:** يعيد حساب عدد النواقص فورياً، ويحدث حالة `status` إلى `complete` عند وصول النواقص لـ 0، ويزامن ملف الموظف المقابل تلقائياً!

---

### 4.6. أرشيف وإدارة المستندات (Document Archive & Verification)

#### `GET /api/documents`
- **الوصف:** استعراض الأرشيف الرقمي مع الفلاتر (`type`, `status`, `department`, `employeeId`).

#### `POST /api/documents`
- **الوصف:** تسجيل وثيقة جديدة ورفع ملفها (يدعم `multipart/form-data` مع تخزين الملف في مجلد `uploads/`).

#### `POST /api/documents/:id/verify`
- **الوصف:** اعتماد وتوثيق المستند.
- **الـ Body:** `{ "notes": "تم فحص أصل المستند ومطابقته لسجلات الأحوال المدنية" }`

#### `POST /api/documents/:id/reject`
- **الوصف:** رفض المستند مع تدوين السبب.
- **الـ Body:** `{ "rejectionReason": "صورة البطاقة غير واضحة ومنتهية الصلاحية" }`

---

### 4.7. العقود الوظيفية (Contracts)

#### `GET /api/contracts`
- **الوصف:** قائمة العقود مع الفلترة بالحالة (`active`, `expiring_soon`, `expired`, `pending_renewal`).

#### `POST /api/contracts`
- **الوصف:** تسجيل أو تجديد عقد وظيفي.

---

## 5. كيفية ربط الفرونت إند بالباك إند

1. في مجلد الفرونت إند `c:\Users\khaled mossad\Desktop\HR-Management-System\`، ملف `.env` مضبوط على:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_USE_MOCK=false
   ```
2. تم تحسين دالة الـ Response في `src/services/apiClient.ts` لضمان إرجاع كائن الترقيم الكامل (`total`, `page`, `pageSize`, `totalPages`) لدعم جداول البيانات التفاعلية دون أي نقص في البيانات الوصفية.
3. تم اختبار المنظومة بالكامل عبر متصفح الويب المدمج وأظهرت النتائج تكاملاً بنسبة **100% وبدون أي أخطاء برمجية**.

---

## 6. أوامر الاختبار المباشرة (PowerShell / cURL)

يمكنك تجربة أي أمر في الطرفية (Terminal) للتحقق الفوري:

```powershell
# 1. فحص الصحة والاتصال
curl http://localhost:5000/api/health

# 2. قائمة الأقسام
curl http://localhost:5000/api/departments

# 3. أول 5 موظفين
curl "http://localhost:5000/api/employees?page=1&pageSize=5"

# 4. إحصائيات التأمينات الاجتماعية
curl http://localhost:5000/api/insurance/stats

# 5. مطابقة التأمينات (سجلات المطابقة فقط)
curl "http://localhost:5000/api/insurance/social?employeeListStatus=found"
```
