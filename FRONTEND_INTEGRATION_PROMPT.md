# 🚀 Master Frontend Integration Prompt
> **انسخ هذا البرومبت بالكامل وأرسله إلى مساعد الذكاء الاصطناعي (AI Assistant) أو مهندس الفرونت إند في مستودع الواجهة الأمامية (`HR-Management-System`) لضبط وتأكيد الربط الكامل مع الباك إند الحقيقي.**

---

```markdown
# 🎯 المهمة: ربط وتأكيد التكامل الكامل للفرونت إند مع الباك إند الحقيقي (Live Backend Integration)

أنت مهندس واجهات أمامية أول (Senior Principal Frontend Engineer) متخصص في React و TypeScript و Vite و TailwindCSS و REST APIs.

تم الانتهاء بنجاح من بناء وتشغيل **الباك إند الحقيقي الكامل (Production-Grade REST API Backend)** لهذا النظام في المجلد المجاور وهو يعمل الآن بالفعل على:
`http://localhost:5000/api`

قاعدة البيانات مبنية بـ Prisma ORM (SQLite / PostgreSQL) ومملوءة بالكامل (Seeded) بالبيانات الحقيقية:
- **11 إدارة وقسم** (مع الإحصائيات ومديري الأقسام والميزانيات)
- **45 مسمى وظيفي** بالعربية والإنجليزية والصينية
- **275 موظف** بجميع بياناتهم الشخصية وأرقامهم القومية ورواتبهم وحصص التأمينات ومسوغات التعيين
- **108 سجل تأمينات اجتماعية** (76 مطابق للموظفين الحاليين + 32 تنبيه غير موجودين)
- **197 سجل متابعة للأوراق ومسوغات التعيين الناقصة**
- **300 مستند مرفوع** (موثق، قيد المراجعة، ومرفوض)
- **275 عقد عمل** بحالات سريانها وتجديدها

---

## ⚙️ 1. إعدادات البيئة (Environment Setup)

تأكد من أن ملف `.env` في جذر مشروع الفرونت إند يحتوي على التالي:

```env
VITE_API_URL=http://localhost:5000/api
VITE_USE_MOCK=false
```

> **ملاحظة مهمة:** عند ضبط `VITE_USE_MOCK=false`، يقوم الفرونت إند بإرسال جميع طلبات الـ HTTP إلى الباك إند الحي `http://localhost:5000/api`. وفي حال انقطاع الباك إند لأي سبب، تم تصميم النظام ليعمل بالـ Offline Mock Data تلقائياً دون أي كراش في الشاشات.

---

## 📡 2. خريطة الـ Endpoints والمطابقة مع Services الفرونت إند

### 🏢 1. خدمات الأقسام والوظائف (`src/services/departmentService.ts`)
- `GET /api/departments`: يجلب جميع الـ 11 إدارة مع عدد الموظفين المحدث تلقائياً (`employeeCount`) وعدد الوظائف (`positionsCount`).
- `GET /api/departments/:id`: تفاصيل القسم مع الوظائف التابعة له.
- `POST /api/departments`: إضافة قسم جديد.
- `GET /api/positions?departmentId=...`: جلب المسميات الوظيفية (مع دعم الفلترة بكود أو ID القسم).

### 👥 2. خدمات دليل الموظفين (`src/services/employeeService.ts`)
- `GET /api/employees`:
  - يدعم معايير الفلترة والترقيم:
    - `page` (افتراضي 1)، `pageSize` (افتراضي 20)
    - `search` (بحث في الاسم، كود الموظف، الرقم القومي، الإيميل، الهاتف، المسمى بالعربي أو الصيني)
    - `departmentId` (فلترة بالقسم)
    - `employmentStatus` (`active`, `probation`, `on_leave`, `suspended`, `terminated`)
    - `contractStatus` (`active`, `expiring_soon`, `expired`, `pending_renewal`)
    - `insuranceStatus` (`insured`, `not_insured`)
    - `documentStatus` (`complete`, `incomplete`)
    - `sortBy` (`employeeId`, `firstName`, `hireDate`, `basicSalary`) و `sortDirection` (`asc`, `desc`)
  - شكل الاستجابة (Pagination Response):
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
- `GET /api/employees/:id`: جلب الملف الشامل للموظف مع كافة العلاقات (القسم، الوظيفة، العقود، المستندات).
- `POST /api/employees`: إنشاء موظف جديد (يحسب الباك إند تلقائياً حصة العامل 11% وحصة الشركة 18.75% إذا كان مؤمناً عليه، ونسبة اكتمال المستندات).
- `PUT /api/employees/:id`: تحديث بيانات الموظف مع إعادة احتساب الحصص والأوراق تلقائياً.
- `DELETE /api/employees/:id`: حذف الموظف مع تنظيف المستندات والعقود التابعة له.
- `POST /api/employees/import`: استيراد شيت إكسل دفعات `{ records: [ ... ] }`.
- `GET /api/employees/stats`: إحصائيات عامة (توزيع الأقسام، حالات العمل، التأمينات، واكتمال المستندات).

### 📑 3. خدمات التأمينات الاجتماعية ومسوغات التعيين (`src/services/insuranceService.ts`)
- `GET /api/insurance/social`:
  - الفلاتر: `search` (الرقم القومي، الاسم، الرقم التأميني)، `department`، `employeeListStatus` (`found`, `not_found`, `all`).
  - الاستجابة: مصفوفة من الـ 108 سجل (76 مطابق + 32 غير مطابق).
- `GET /api/insurance/stats`:
  - إحصائيات المطابقة المالية:
    - `totalRecords`: 108
    - `foundCount`: 76
    - `notFoundCount`: 32
    - `totalInsuranceWage`: 467,100.00 ج.م
    - `totalWorkerContributions`: 51,391.80 ج.م (حصة العامل 11%)
    - `totalCompanyContributions`: 87,602.04 ج.م (حصة الشركة 18.75%)
- `POST /api/insurance/social/import`: استيراد شيت تأمينات مجمعة.
- `GET /api/insurance/missing-documents`:
  - قائمة تتبع الأوراق الناقصة (شهادة المؤهل، الميلاد، البطاقة، العقد).
  - الفلاتر: `search`, `department`, `status` (`complete`, `incomplete`), `missingDoc` (`qualification`, `birth`, `idCard`, `contract`).
- `PATCH /api/insurance/missing-documents/:id` أو `PATCH /api/insurance/missing-documents/:id/toggle`:
  - تحديث/تبديل حالة المستند:
    ```json
    {
      "documentType": "qualificationCert",
      "status": "available"
    }
    ```
  - يقوم الباك إند بتحديث عدد الأوراق الناقصة (`missingCount`) ونسبة الاكتمال ومزامنة ذلك في جدول الموظف فورياً!
- `POST /api/insurance/missing-documents/import`: استيراد شيت مسوغات ناقصة.

### 📂 4. خدمات إدارة المستندات والأرشيف (`src/services/documentService.ts`)
- `GET /api/documents`: أرشيف المستندات المرفوعة مع الفلترة بـ `type`, `status` (`verified`, `under_review`, `rejected`), `employeeId`, `department`.
- `POST /api/documents`: رفع مستند جديد (يدعم `multipart/form-data` مع ملف حقيقي أو JSON).
- `POST /api/documents/:id/verify`: توثيق واعتماد المستند مع تسجيل الملاحظات وتاريخ الاعتماد واسم المدقق.
- `POST /api/documents/:id/reject`: رفض المستند مع تسجيل سبب الرفض (`rejectionReason`).

### 📝 5. خدمات العقود الوظيفية (`src/services/contractService.ts`)
- `GET /api/contracts`: قائمة العقود ومرتبات الموظفين وتواريخ التجديد وتنبيهات العقود المنتهية وقيد التجديد.
- `GET /api/contracts/:id`: تفاصيل العقد وشروطه.
- `POST /api/contracts`: تسجيل وتجديد عقد عمل.

---

## 🛠️ 3. المطلوب منك تنفيذه في مشروع الفرونت إند:

1. **فحص الـ API Client (`src/services/apiClient.ts`)**:
   - تأكد من أن الـ `apiClient` يقرأ المتغير `VITE_API_URL` و `VITE_USE_MOCK=false`.
   - تأكد من أن دالة معالجة الاستجابة `handleResponse` تحتفظ بكائن الـ Pagination الكامل عند وجود خاصية `total`:
     ```ts
     const json = await response.json();
     if (json && json.total !== undefined) {
       return json;
     }
     return json.data !== undefined ? json.data : json;
     ```
2. **التحقق من عمل الشاشات الرئيسية مع البيانات الحية**:
   - **لوحة المعلومات (Dashboard)**: تحقق من عرض مؤشرات الـ 275 موظف وتوزيع الأقسام ونسب التأمينات.
   - **دليل الموظفين (Employees Directory)**: تحقق من التنقل بين الصفحات (Pagination) وعمل فلاتر البحث والفرز وعرض تفاصيل الموظف عند النقر عليه.
   - **مطابقة التأمينات (Social Insurance)**: تأكد من ظهور الـ 108 سجل (مع إشعارات الـ 76 المطابقين والـ 32 غير الموجودين) وتطابق الـ Stats المالية.
   - **شيت مسوغات التعيين (Missing Documents)**: تأكد من إمكانية النقر على أي وثيقة لتبديل حالتها (Toggle)، ومشاهدة التحديث الحي للقيمة في قاعدة البيانات.
   - **أرشيف المستندات (Documents Management)**: تأكد من أزرار الاعتماد (Verify) والرفض (Reject) وتحديث حالة المستند مباشرة.
3. **التأكد من عدم وجود أي خطأ (Console Error)** أو بطء في التحميل وإبلاغي بتقرير نهائي عن جاهزية النظام للإنتاج.
```
