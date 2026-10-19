import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clear existing data in correct FK order
  console.log('🧹 Cleaning existing tables...');
  await prisma.documentRecord.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.employeeMissingDocument.deleteMany();
  await prisma.socialInsurance.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.position.deleteMany();
  await prisma.department.deleteMany();
  await prisma.driverPayoutTransaction.deleteMany();
  await prisma.weeklyPayoutSummary.deleteMany();
  await prisma.driver.deleteMany();

  // 2. Load seed_data.json
  const seedPath = path.join(__dirname, '../database/seed_data.json');
  if (!fs.existsSync(seedPath)) {
    throw new Error(`seed_data.json not found at ${seedPath}`);
  }

  const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));

  // 3. Seed Departments (11 departments)
  console.log(`🏢 Seeding ${seedData.departments.length} departments...`);
  for (const dept of seedData.departments) {
    await prisma.department.create({
      data: {
        id: dept.id,
        code: dept.code,
        name: dept.name,
        nameAr: dept.nameAr,
        nameZh: dept.nameZh,
        managerId: dept.managerId || null,
        managerName: dept.managerName || null,
        employeeCount: Number(dept.employeeCount) || 0,
        location: dept.location || null,
        budget: Number(dept.budget) || 0,
      },
    });
  }

  // 4. Seed Positions
  console.log(`💼 Seeding positions...`);
  const existingPositions = new Set<string>();
  for (const pos of seedData.positions) {
    await prisma.position.create({
      data: {
        id: pos.id,
        code: pos.code,
        title: pos.title,
        titleAr: pos.titleAr,
        titleZh: pos.titleZh,
        departmentId: pos.departmentId,
        departmentName: pos.departmentName || null,
        minSalary: Number(pos.minSalary) || 0,
        maxSalary: Number(pos.maxSalary) || 0,
        level: pos.level || 'Mid',
      },
    });
    existingPositions.add(pos.id);
  }

  // Ensure any position referenced by employees exists
  for (const emp of seedData.employees) {
    if (!existingPositions.has(emp.positionId)) {
      await prisma.position.create({
        data: {
          id: emp.positionId,
          code: `POS-${emp.positionId.toUpperCase()}`,
          title: emp.positionTitle || 'Specialist',
          titleAr: emp.positionTitle || 'أخصائي',
          titleZh: emp.chinesePosition || '专员',
          departmentId: emp.departmentId,
          departmentName: emp.departmentName || null,
          minSalary: 4000,
          maxSalary: 8000,
          level: 'Mid',
        },
      });
      existingPositions.add(emp.positionId);
    }
  }

  // 5. Seed Employees (275 employees)
  console.log(`👥 Seeding ${seedData.employees.length} employees...`);
  for (const emp of seedData.employees) {
    await prisma.employee.create({
      data: {
        id: emp.id,
        employeeId: emp.employeeId,
        firstName: emp.firstName,
        lastName: emp.lastName,
        arabicName: emp.arabicName || null,
        chineseName: emp.chineseName || null,
        email: emp.email || null,
        phone: emp.phone || null,
        avatar: emp.avatar || null,
        nationalId: emp.nationalId,
        dateOfBirth: emp.dateOfBirth || null,
        gender: emp.gender || 'male',
        nationality: emp.nationality || 'Egyptian',
        address: emp.address || null,
        emergencyContact: emp.emergencyContact ? JSON.stringify(emp.emergencyContact) : null,
        departmentId: emp.departmentId,
        departmentName: emp.departmentName,
        positionId: emp.positionId,
        positionTitle: emp.positionTitle,
        chinesePosition: emp.chinesePosition || null,
        managerId: emp.managerId || null,
        managerName: emp.managerName || null,
        employmentStatus: emp.employmentStatus || 'active',
        employmentType: emp.employmentType || 'full_time',
        hireDate: emp.hireDate,
        probationEndDate: emp.probationEndDate || null,
        resignationDate: emp.resignationDate || null,
        workLocation: emp.workLocation || 'Main Facility',
        basicSalary: Number(emp.basicSalary) || 4325.0,
        housingAllowance: Number(emp.housingAllowance) || 0.0,
        transportAllowance: Number(emp.transportAllowance) || 0.0,
        contractStatus: emp.contractStatus || 'active',
        documentCompletenessPercentage: Number(emp.documentCompletenessPercentage) || 100,
        missingDocumentsCount: Number(emp.missingDocumentsCount) || 0,
        insuranceStatus: emp.insuranceStatus || 'not_insured',
        insuranceNumber: emp.insuranceNumber || null,
        insuranceSalary: emp.insuranceSalary !== undefined ? Number(emp.insuranceSalary) : 4325.0,
        workerShare: emp.workerShare !== undefined ? Number(emp.workerShare) : 475.85,
        companyShare: emp.companyShare !== undefined ? Number(emp.companyShare) : 811.13,
        insuranceNote: emp.insuranceNote || null,
        qualificationCertificateStatus: emp.qualificationCertificateStatus || 'missing',
        birthCertificateStatus: emp.birthCertificateStatus || 'missing',
        idCardStatus: emp.idCardStatus || 'missing',
        contractDocStatus: emp.contractDocStatus || 'missing',
        documentChecklistStatus: emp.documentChecklistStatus || 'incomplete',
        missingNotes: emp.missingNotes || null,
      },
    });
  }

  // 6. Seed Social Insurance (108 records)
  console.log(`📑 Seeding ${seedData.socialInsurance.length} social insurance records...`);
  for (const s of seedData.socialInsurance) {
    await prisma.socialInsurance.create({
      data: {
        id: s.id,
        serialNo: Number(s.serialNo),
        nationalId: s.nationalId,
        employeeName: s.employeeName,
        department: s.department,
        insuranceNumber: s.insuranceNumber,
        insuranceSalary: Number(s.insuranceSalary) || 4325.0,
        workerShare: Number(s.workerShare) || 475.85,
        companyShare: Number(s.companyShare) || 811.13,
        totalContribution: Number(s.totalContribution) || 1286.98,
        note: s.note || null,
        employeeListStatus: s.employeeListStatus || 'found',
        employeeCode: s.employeeCode || null,
      },
    });
  }

  // 7. Seed Missing Documents (197 records)
  console.log(`📋 Seeding ${seedData.missingDocuments.length} missing document tracking records...`);
  for (const m of seedData.missingDocuments) {
    await prisma.employeeMissingDocument.create({
      data: {
        id: m.id,
        serialNo: Number(m.serialNo),
        department: m.department,
        employeeName: m.employeeName,
        nationalId: m.nationalId,
        position: m.position,
        startDate: m.startDate || null,
        resignationDate: m.resignationDate || null,
        employeeCode: m.employeeCode,
        insuranceStatus: m.insuranceStatus || 'not_insured',
        qualificationCert: m.qualificationCert || 'missing',
        birthCert: m.birthCert || 'missing',
        idCard: m.idCard || 'missing',
        contract: m.contract || 'missing',
        missingCount: Number(m.missingCount) || 0,
        notes: m.notes || null,
        status: m.status || 'incomplete',
      },
    });
  }

  // 8. Seed Document Records (Initial verified & review documents for employees)
  console.log(`📂 Seeding Document Records...`);
  const docTypes = [
    { type: 'national_id', title: 'بطاقة الرقم القومي (National ID)' },
    { type: 'birth_certificate', title: 'شهادة الميلاد (Birth Certificate)' },
    { type: 'qualification', title: 'المؤهل الدراسي (Qualification Certificate)' },
    { type: 'contract', title: 'عقد العمل الموثق (Employment Contract)' },
    { type: 'insurance', title: 'كعب العمل والتأمينات (Social Insurance Record)' },
  ];

  let docCount = 0;
  // Seed documents for first 60 employees
  for (let i = 0; i < Math.min(60, seedData.employees.length); i++) {
    const emp = seedData.employees[i];
    for (let j = 0; j < docTypes.length; j++) {
      const dt = docTypes[j];
      const isVerified = (i + j) % 3 !== 0;
      const isRejected = (i + j) % 11 === 0;
      const status = isRejected ? 'rejected' : isVerified ? 'verified' : 'under_review';

      await prisma.documentRecord.create({
        data: {
          id: `doc-${emp.id}-${dt.type}`,
          employeeId: emp.id,
          employeeName: emp.arabicName || `${emp.firstName} ${emp.lastName}`,
          department: emp.departmentName,
          type: dt.type,
          title: dt.title,
          fileName: `${emp.employeeId}_${dt.type.toUpperCase()}.pdf`,
          fileUrl: `/uploads/${emp.employeeId}_${dt.type}.pdf`,
          fileSize: `${(1.2 + (j * 0.4)).toFixed(1)} MB`,
          status,
          expiryDate: dt.type === 'national_id' ? '2030-12-31' : null,
          uploadedAt: '2025-11-10',
          verifiedAt: status === 'verified' ? '2025-11-12' : null,
          verifiedBy: status === 'verified' ? 'Sarah Al-Ghamdi (HR Ops)' : null,
          notes: status === 'rejected' ? 'صورة المستند غير واضحة وتحتاج لإعادة رفع' : 'مطابق للأصل ومفحوص من الموارد البشرية',
          rejectionReason: status === 'rejected' ? 'الصورة غير واضحة، يرجى إعادة رفع نسخة PDF ممسوحة ضوئياً بدقة عالية' : null,
        },
      });
      docCount++;
    }
  }
  console.log(`✅ Seeded ${docCount} document records.`);

  // 9. Seed Contracts for all employees
  console.log(`📝 Seeding Contracts...`);
  for (let idx = 0; idx < seedData.employees.length; idx++) {
    const emp = seedData.employees[idx];
    const startYear = parseInt(emp.hireDate ? emp.hireDate.split('-')[0] : '2023', 10);
    const startDate = `${startYear}-01-01`;
    let endDate = `${startYear + 2}-12-31`;

    if (emp.contractStatus === 'expiring_soon') {
      endDate = '2026-11-30';
    } else if (emp.contractStatus === 'expired') {
      endDate = '2026-08-31';
    } else if (emp.contractStatus === 'pending_renewal') {
      endDate = '2026-12-15';
    }

    await prisma.contract.create({
      data: {
        id: `cnt-${emp.id}`,
        contractNumber: `CNT-2025-${String(idx + 1001)}`,
        employeeId: emp.id,
        employeeCode: emp.employeeId,
        employeeName: emp.arabicName || `${emp.firstName} ${emp.lastName}`,
        department: emp.departmentName,
        type: idx % 4 === 0 ? 'indefinite' : 'fixed_term',
        startDate,
        endDate: idx % 4 === 0 ? 'Indefinite' : endDate,
        status: emp.contractStatus || 'active',
        salary: Number(emp.basicSalary) + Number(emp.housingAllowance) + Number(emp.transportAllowance),
        noticePeriodDays: 30,
        renewalCount: Math.max(0, 2026 - startYear),
        termsSummary: 'عقد عمل محدد المدة خاضع لأحكام قانون العمل ولوائح الشركة الداخلية.',
      },
    });
  }
  console.log(`✅ Seeded ${seedData.employees.length} contracts.`);

  // 10. Seed Drivers & Weekly Payouts
  const { seedDriversAndPayouts } = await import('../src/db/seed_drivers');
  await seedDriversAndPayouts();

  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
