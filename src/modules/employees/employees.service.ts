import { prisma } from '../../db/prisma';
import { logAuditEvent } from '../audit/audit.service';

export interface EmployeeFilterQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  departmentId?: string;
  employmentStatus?: string;
  contractStatus?: string;
  insuranceStatus?: string;
  documentStatus?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

function parseEmergencyContact(contact: string | null) {
  if (!contact) return null;
  try {
    return JSON.parse(contact);
  } catch {
    return contact;
  }
}

function computeDocumentStatus(docs: {
  qualification?: string;
  birth?: string;
  idCard?: string;
  contract?: string;
}) {
  const items = [
    docs.qualification === 'available',
    docs.birth === 'available',
    docs.idCard === 'available',
    docs.contract === 'available',
  ];
  const availableCount = items.filter(Boolean).length;
  const missingCount = 4 - availableCount;
  const completeness = Math.round((availableCount / 4) * 100);
  const checklistStatus = missingCount === 0 ? 'complete' : 'incomplete';

  return {
    missingDocumentsCount: missingCount,
    documentCompletenessPercentage: completeness,
    documentChecklistStatus: checklistStatus,
  };
}


const DEPARTMENT_CODE_MAP: Record<string, string> = {
  // 10: Human Resources
  'dept-hr': '10',
  'hr': '10',
  'human resources': '10',
  'الموارد البشرية': '10',
  'الموارد البشرية والشؤون الإدارية': '10',

  // 20: Production Unit
  'dept-pud': '20',
  'pud': '20',
  'production unit': '20',
  'قطاع الإنتاج': '20',
  'قطاع الإنتاج والتشغيل': '20',

  // 30: Sales Dept - Fish
  'dept-sdf': '30',
  'sd-fish': '30',
  'sales dept - fish': '30',
  'مبيعات قطاع الأسماك': '30',

  // 40: Sales Dept - Poultry
  'dept-sdp': '40',
  'sd-poultry': '40',
  'sales dept - poultry': '40',
  'مبيعات قطاع الدواجن': '40',

  // 50: Finance Department
  'dept-fd': '50',
  'fd': '50',
  'finance department': '50',
  'finance': '50',
  'الإدارة المالية': '50',
  'الإدارة المالية والحسابات': '50',

  // 60: Quality Control
  'dept-qc': '60',
  'qc': '60',
  'quality control': '60',
  'رقابة الجودة': '60',
  'رقابة الجودة والمعامل': '60',

  // 70: Production Dept - Fish
  'dept-pdf': '70',
  'pd-fish': '70',
  'production dept - fish': '70',
  'إنتاج الأسماك': '70',
  'إدارة إنتاج الأسماك': '70',

  // 80: Production Dept - Poultry
  'dept-pdp': '80',
  'pd-poultry': '80',
  'production dept - poultry': '80',
  'إنتاج الدواجن': '80',
  'إدارة إنتاج الدواجن': '80',

  // 90: Production Department
  'dept-pd': '90',
  'pd': '90',
  'production department': '90',
  'إدارة الإنتاج': '90',
  'إدارة الإنتاج والتصنيع': '90',
};

async function generateDepartmentEmployeeId(departmentId?: string, departmentName?: string): Promise<string> {
  const COMPANY_CODE = '16030';
  let deptCode = '';

  // 1. Check departmentId in DB
  if (departmentId) {
    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (dept) {
      const idKey = dept.id.toLowerCase();
      const codeKey = (dept.code || '').toLowerCase();
      const nameKey = (dept.name || '').toLowerCase();
      const nameArKey = (dept.nameAr || '').toLowerCase();

      deptCode =
        DEPARTMENT_CODE_MAP[idKey] ||
        DEPARTMENT_CODE_MAP[codeKey] ||
        DEPARTMENT_CODE_MAP[nameKey] ||
        DEPARTMENT_CODE_MAP[nameArKey] ||
        '';

      if (!deptCode) {
        for (const [k, code] of Object.entries(DEPARTMENT_CODE_MAP)) {
          if (nameKey.includes(k) || nameArKey.includes(k) || codeKey.includes(k)) {
            deptCode = code;
            break;
          }
        }
      }
    }
  }

  // 2. Fallback check by raw departmentId / departmentName
  if (!deptCode && departmentId) {
    const key = departmentId.toLowerCase();
    for (const [k, code] of Object.entries(DEPARTMENT_CODE_MAP)) {
      if (key === k || key.includes(k)) {
        deptCode = code;
        break;
      }
    }
  }

  if (!deptCode && departmentName) {
    const key = departmentName.toLowerCase();
    for (const [k, code] of Object.entries(DEPARTMENT_CODE_MAP)) {
      if (key === k || key.includes(k)) {
        deptCode = code;
        break;
      }
    }
  }

  // 3. Fallback: if department has existing employees with IDs matching 16030XX..., infer code
  if (!deptCode && (departmentId || departmentName)) {
    const existingEmp = await prisma.employee.findFirst({
      where: {
        OR: [
          ...(departmentId ? [{ departmentId }] : []),
          ...(departmentName ? [{ departmentName }] : []),
        ],
        employeeId: { startsWith: COMPANY_CODE },
      },
      select: { employeeId: true },
    });
    if (existingEmp && existingEmp.employeeId.length >= 7) {
      deptCode = existingEmp.employeeId.substring(5, 7);
    }
  }

  // 4. Default to '10' (Human Resources) if still not found
  if (!deptCode) {
    deptCode = '10';
  }

  const deptPrefix = `${COMPANY_CODE}${deptCode}`;

  // Find all employees whose employeeId starts with this prefix
  const matchingEmps = await prisma.employee.findMany({
    where: {
      employeeId: { startsWith: deptPrefix },
    },
    select: { employeeId: true },
  });

  let maxSeq = 0;
  for (const emp of matchingEmps) {
    const suffix = emp.employeeId.slice(deptPrefix.length);
    const num = parseInt(suffix, 10);
    if (!isNaN(num) && num > maxSeq) {
      maxSeq = num;
    }
  }

  const nextSeq = maxSeq + 1;
  const seqPadded = nextSeq < 100 ? String(nextSeq).padStart(2, '0') : String(nextSeq);
  return `${deptPrefix}${seqPadded}`;
}

export class EmployeesService {
  async findPaginated(query: EmployeeFilterQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const where: any = {};

    // 1. Search Query
    if (query.search) {
      const q = query.search.trim();
      where.OR = [
        { employeeId: { contains: q } },
        { firstName: { contains: q } },
        { lastName: { contains: q } },
        { arabicName: { contains: q } },
        { chineseName: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
        { nationalId: { contains: q } },
        { positionTitle: { contains: q } },
        { chinesePosition: { contains: q } },
      ];
    }

    // 2. Department filter
    if (query.departmentId && query.departmentId !== 'all') {
      where.OR = where.OR || [];
      where.AND = [
        {
          OR: [
            { departmentId: query.departmentId },
            { departmentName: query.departmentId },
          ],
        },
      ];
    }

    // 3. Employment Status filter
    if (query.employmentStatus && query.employmentStatus !== 'all') {
      where.employmentStatus = query.employmentStatus;
    }

    // 4. Contract Status filter
    if (query.contractStatus && query.contractStatus !== 'all') {
      where.contractStatus = query.contractStatus;
    }

    // 5. Insurance Status filter
    if (query.insuranceStatus && query.insuranceStatus !== 'all') {
      where.insuranceStatus = query.insuranceStatus;
    }

    // 6. Document Status filter
    if (query.documentStatus && query.documentStatus !== 'all') {
      where.documentChecklistStatus = query.documentStatus;
    }

    // 7. Sorting
    const allowedSortFields = ['employeeId', 'firstName', 'hireDate', 'basicSalary', 'createdAt'];
    const sortBy = allowedSortFields.includes(query.sortBy || '') ? query.sortBy! : 'employeeId';
    const sortDirection = query.sortDirection === 'desc' ? 'desc' : 'asc';

    const [total, rawEmployees] = await Promise.all([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortDirection },
        include: {
          department: {
            select: { id: true, code: true, name: true, nameAr: true, nameZh: true },
          },
          position: {
            select: { id: true, code: true, title: true, titleAr: true, titleZh: true },
          },
        },
      }),
    ]);

    const employees = rawEmployees.map(emp => ({
      ...emp,
      emergencyContact: parseEmergencyContact(emp.emergencyContact),
    }));

    const totalPages = Math.ceil(total / pageSize);

    return {
      data: employees,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async findById(id: string) {
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [{ id }, { employeeId: id }, { nationalId: id }],
      },
      include: {
        department: true,
        position: true,
        documents: true,
        contracts: true,
      },
    });

    if (!employee) return null;

    return {
      ...employee,
      emergencyContact: parseEmergencyContact(employee.emergencyContact),
    };
  }

  async create(data: any) {
    const id = data.id || `emp-${Date.now()}`;
    let employeeId = data.employeeId;
    if (!employeeId) {
      employeeId = await generateDepartmentEmployeeId(data.departmentId, data.departmentName);
    }

    // Check Department & Position names
    let departmentName = data.departmentName;
    if (!departmentName && data.departmentId) {
      const dept = await prisma.department.findUnique({ where: { id: data.departmentId } });
      departmentName = dept?.name || 'Operations';
    }

    let positionTitle = data.positionTitle;
    if (!positionTitle && data.positionId) {
      const pos = await prisma.position.findUnique({ where: { id: data.positionId } });
      positionTitle = pos?.title || 'Specialist';
    }

    // Compute Insurance Shares
    const insuranceSalary = Number(data.insuranceSalary || data.basicSalary || 4325.0);
    const workerShare = data.insuranceStatus === 'insured' ? Number((insuranceSalary * 0.11).toFixed(2)) : 0;
    const companyShare = data.insuranceStatus === 'insured' ? Number((insuranceSalary * 0.1875).toFixed(2)) : 0;

    // Compute Document Completeness
    const docStatus = computeDocumentStatus({
      qualification: data.qualificationCertificateStatus,
      birth: data.birthCertificateStatus,
      idCard: data.idCardStatus,
      contract: data.contractDocStatus,
    });

    const nid = String(data.nationalId || '').trim().replace(/[^0-9]/g, '');
    let derivedGender = data.gender;
    let derivedDob = data.dateOfBirth;
    if (nid.length === 14) {
      const century = parseInt(nid[0], 10) === 3 ? 2000 : 1900;
      const yr = parseInt(nid.substring(1, 3), 10);
      const mo = nid.substring(3, 5);
      const da = nid.substring(5, 7);
      if (!derivedDob) derivedDob = `${century + yr}-${mo}-${da}`;
      if (!derivedGender) {
        derivedGender = parseInt(nid[12], 10) % 2 === 0 ? 'female' : 'male';
      }
    }

    const emergencyContactStr = data.emergencyContact
      ? typeof data.emergencyContact === 'string'
        ? data.emergencyContact
        : JSON.stringify(data.emergencyContact)
      : null;

    const created = await prisma.employee.create({
      data: {
        id,
        employeeId,
        firstName: data.firstName,
        lastName: data.lastName,
        arabicName: data.arabicName || `${data.firstName} ${data.lastName}`,
        chineseName: data.chineseName || null,
        email: data.email || null,
        phone: data.phone || null,
        avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.firstName)}`,
        nationalId: data.nationalId,
        dateOfBirth: derivedDob || null,
        gender: derivedGender || 'male',
        nationality: data.nationality || 'Egyptian',
        address: data.address || null,
        emergencyContact: emergencyContactStr,
        departmentId: data.departmentId,
        departmentName: departmentName || 'Operations',
        positionId: data.positionId,
        positionTitle: positionTitle || 'Staff',
        chinesePosition: data.chinesePosition || null,
        managerId: data.managerId || null,
        managerName: data.managerName || null,
        employmentStatus: data.employmentStatus || 'active',
        employmentType: data.employmentType || 'full_time',
        hireDate: data.hireDate,
        probationEndDate: data.probationEndDate || null,
        resignationDate: data.resignationDate || null,
        workLocation: data.workLocation || 'Main Facility',
        basicSalary: Number(data.basicSalary) || 4325.0,
        housingAllowance: Number(data.housingAllowance) || 0.0,
        transportAllowance: Number(data.transportAllowance) || 0.0,
        contractStatus: data.contractStatus || 'active',
        documentCompletenessPercentage: docStatus.documentCompletenessPercentage,
        missingDocumentsCount: docStatus.missingDocumentsCount,
        insuranceStatus: data.insuranceStatus || 'not_insured',
        insuranceNumber: data.insuranceNumber || null,
        insuranceSalary,
        workerShare,
        companyShare,
        insuranceNote: data.insuranceNote || null,
        qualificationCertificateStatus: data.qualificationCertificateStatus || 'missing',
        birthCertificateStatus: data.birthCertificateStatus || 'missing',
        idCardStatus: data.idCardStatus || 'missing',
        contractDocStatus: data.contractDocStatus || 'missing',
        documentChecklistStatus: docStatus.documentChecklistStatus,
        missingNotes: data.missingNotes || null,
      },
      include: {
        department: true,
        position: true,
      },
    });

    logAuditEvent({
      userName: 'Khaled Mossad',
      userRole: 'System Administrator',
      action: 'Created Employee Record',
      module: 'Employee Directory',
      target: `${created.firstName} ${created.lastName} (${created.employeeId})`,
      status: 'success',
      details: { department: created.department?.name, salary: created.basicSalary },
    }).catch(() => {});

    return {
      ...created,
      emergencyContact: parseEmergencyContact(created.emergencyContact),
    };
  }

  async update(id: string, updates: any) {
    const existing = await prisma.employee.findFirst({
      where: {
        OR: [{ id }, { employeeId: id }],
      },
    });

    if (!existing) return null;

    const updateData: any = { ...updates };
    delete updateData.id;

    if (updates.emergencyContact) {
      updateData.emergencyContact =
        typeof updates.emergencyContact === 'string'
          ? updates.emergencyContact
          : JSON.stringify(updates.emergencyContact);
    }

    // Recompute document checklist if any status changed
    const qual = updates.qualificationCertificateStatus ?? existing.qualificationCertificateStatus;
    const birth = updates.birthCertificateStatus ?? existing.birthCertificateStatus;
    const idCard = updates.idCardStatus ?? existing.idCardStatus;
    const contract = updates.contractDocStatus ?? existing.contractDocStatus;

    const docStatus = computeDocumentStatus({
      qualification: qual,
      birth,
      idCard,
      contract,
    });
    updateData.missingDocumentsCount = docStatus.missingDocumentsCount;
    updateData.documentCompletenessPercentage = docStatus.documentCompletenessPercentage;
    updateData.documentChecklistStatus = docStatus.documentChecklistStatus;

    // Recompute insurance if needed
    if (updates.insuranceSalary || updates.insuranceStatus) {
      const status = updates.insuranceStatus ?? existing.insuranceStatus;
      const salary = Number(updates.insuranceSalary ?? existing.insuranceSalary ?? 4325.0);
      updateData.workerShare = status === 'insured' ? Number((salary * 0.11).toFixed(2)) : 0;
      updateData.companyShare = status === 'insured' ? Number((salary * 0.1875).toFixed(2)) : 0;
    }

    const updated = await prisma.employee.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        department: true,
        position: true,
      },
    });

    logAuditEvent({
      userName: 'Khaled Mossad',
      userRole: 'System Administrator',
      action: 'Updated Employee Profile',
      module: 'Employee Directory',
      target: `${updated.firstName} ${updated.lastName} (${updated.employeeId})`,
      status: 'success',
      details: updateData,
    }).catch(() => {});

    return {
      ...updated,
      emergencyContact: parseEmergencyContact(updated.emergencyContact),
    };
  }

  async delete(id: string) {
    const existing = await prisma.employee.findFirst({
      where: {
        OR: [{ id }, { employeeId: id }],
      },
    });

    if (!existing) return false;

    // Delete cascading items first
    await prisma.documentRecord.deleteMany({ where: { employeeId: existing.id } });
    await prisma.contract.deleteMany({ where: { employeeId: existing.id } });
    await prisma.employee.delete({ where: { id: existing.id } });

    logAuditEvent({
      userName: 'Khaled Mossad',
      userRole: 'System Administrator',
      action: 'Deleted Employee Record',
      module: 'Employee Directory',
      target: `${existing.firstName} ${existing.lastName} (${existing.employeeId})`,
      status: 'warning',
    }).catch(() => {});

    return true;
  }

  async bulkDelete(ids: string[]) {
    if (!ids || !ids.length) return 0;
    const existing = await prisma.employee.findMany({
      where: {
        OR: [{ id: { in: ids } }, { employeeId: { in: ids } }],
      },
      select: { id: true },
    });
    const foundIds = existing.map(e => e.id);
    if (!foundIds.length) return 0;

    await prisma.documentRecord.deleteMany({
      where: { employeeId: { in: foundIds } },
    });
    await prisma.contract.deleteMany({
      where: { employeeId: { in: foundIds } },
    });
    const res = await prisma.employee.deleteMany({
      where: { id: { in: foundIds } },
    });
    return res.count;
  }

  async deleteAll() {
    await prisma.documentRecord.deleteMany({});
    await prisma.contract.deleteMany({});
    const res = await prisma.employee.deleteMany({});
    return res.count;
  }

    async batchImport(records: any[], overwrite = false) {
    let insertedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    if (overwrite) {
      await prisma.employeeMissingDocument.deleteMany({}).catch(() => {});
      await prisma.employee.deleteMany({}).catch(() => {});
    }

    const knownDeptMetadata: Record<string, { id: string; code: string; name: string; nameAr: string; nameZh: string }> = {
      'HR': { id: 'dept-hr', code: 'HR', name: 'Human Resources', nameAr: 'الموارد البشرية والشؤون الإدارية', nameZh: '人力资源与行政部' },
      'PUD': { id: 'dept-pud', code: 'PUD', name: 'Production Unit', nameAr: 'قطاع الإنتاج', nameZh: '生产部' },
      'FD': { id: 'dept-fd', code: 'FD', name: 'Finance Department', nameAr: 'الإدارة المالية', nameZh: '财务部' },
      'QC': { id: 'dept-qc', code: 'QC', name: 'Quality Control', nameAr: 'مراقبة الجودة', nameZh: '品控部' },
      'SD-FISH': { id: 'dept-sdf', code: 'SD-FISH', name: 'Sales Dept - Fish', nameAr: 'مبيعات الأسماك', nameZh: '水产销售部' },
      'SD-POULTRY': { id: 'dept-sdp', code: 'SD-POULTRY', name: 'Sales Dept - Poultry', nameAr: 'مبيعات الدواجن', nameZh: '家禽销售部' },
      'PD-FISH': { id: 'dept-pdf', code: 'PD-FISH', name: 'Production Dept - Fish', nameAr: 'إنتاج الأسماك', nameZh: '水产生产部' },
      'PD-POULTRY': { id: 'dept-pdp', code: 'PD-POULTRY', name: 'Production Dept - Poultry', nameAr: 'إنتاج الدواجن', nameZh: '禽料生产部' },
      'PD': { id: 'dept-pd', code: 'PD', name: 'Production Department', nameAr: 'إدارة الإنتاج', nameZh: '生产制造部' },
    };

    const allDepts = await prisma.department.findMany();
    for (const meta of Object.values(knownDeptMetadata)) {
      const exists = allDepts.find(d => d.code.toUpperCase() === meta.code.toUpperCase() || d.id === meta.id);
      if (!exists) {
        try {
          const created = await prisma.department.create({ data: meta });
          allDepts.push(created);
        } catch {}
      }
    }

    const allPositions = await prisma.position.findMany();
    const defaultDept = allDepts[0];
    const defaultPos = allPositions[0];

    const allExisting = overwrite ? [] : await prisma.employee.findMany();
    const empByEmployeeId = new Map(allExisting.map(e => [e.employeeId, e]));
    const empByNationalId = new Map(allExisting.map(e => [e.nationalId, e]));

    const processRecord = async (rec: any, idx: number) => {
      try {
        if (!rec.nationalId || !rec.employeeId) {
          skippedCount++;
          errors.push(`Row ${idx + 1}: Missing employeeId or nationalId`);
          return;
        }

        const strEmpId = String(rec.employeeId).trim();
        const strNatId = String(rec.nationalId).trim();
        const existing = empByEmployeeId.get(strEmpId) || empByNationalId.get(strNatId);

        const deptVal = String(rec.department || rec.departmentName || 'HR').trim();
        const upperDept = deptVal.toUpperCase();

        let deptRecord = allDepts.find(d => 
          d.code.toUpperCase() === upperDept ||
          d.id.toUpperCase() === upperDept ||
          d.name.toLowerCase() === deptVal.toLowerCase() ||
          d.nameAr === deptVal
        );

        if (!deptRecord) {
          const safeCode = upperDept.replace(/[^A-Z0-9-]/g, '').slice(0, 10) || 'GEN';
          const safeId = `dept-${safeCode.toLowerCase()}`;
          try {
            deptRecord = await prisma.department.create({
              data: {
                id: safeId,
                code: safeCode,
                name: deptVal,
                nameAr: deptVal,
                nameZh: deptVal,
              },
            });
            allDepts.push(deptRecord);
          } catch {
            deptRecord = defaultDept;
          }
        }

        const deptId = deptRecord?.id || defaultDept?.id;
        const deptName = deptRecord?.name || deptVal;

        const posVal = String(rec.chinesePosition || rec.positionTitle || rec.position || 'Staff').trim();
        let posTitle = posVal.includes('-') ? posVal.split('-')[1].trim() : posVal;
        const chinesePosition = rec.chinesePosition || posVal;
        const posZh = posVal.includes('-') ? posVal.split('-')[0].trim() : posVal;

        let posRecord = allPositions.find(p => 
          p.title.toLowerCase() === posTitle.toLowerCase() ||
          p.titleZh === posZh ||
          p.titleZh === posVal ||
          p.code.toLowerCase() === posTitle.toLowerCase()
        );

        if (!posRecord) {
          const safePosId = `pos-${deptRecord.code.toLowerCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const safePosCode = `POS-${Date.now() % 100000}-${Math.floor(Math.random() * 1000)}`;
          try {
            posRecord = await prisma.position.create({
              data: {
                id: safePosId,
                code: safePosCode,
                title: posTitle,
                titleAr: posTitle,
                titleZh: posZh,
                departmentId: deptId,
                departmentName: deptName,
              },
            });
            allPositions.push(posRecord);
          } catch {
            posRecord = allPositions.find(p => p.departmentId === deptId) || defaultPos;
          }
        }

        const posId = posRecord?.id || defaultPos?.id;
        const finalPosTitle = posRecord?.title || posTitle || 'Staff';

        const rawFullName = String(
          rec.name || rec.arabicName || `${rec.firstName || ''} ${rec.lastName || ''}`.trim() || 'Employee'
        ).trim();
        const parts = rawFullName.split(/s+/);
        const firstName = rec.firstName || parts[0] || 'Employee';
        const lastName = rec.lastName || (parts.length > 1 ? parts.slice(1).join(' ') : 'Staff');
        const arabicName = rec.arabicName || rec.name || rawFullName;

        let hireDateStr = '2023-01-01';
        if (rec.hireDate) {
          if (typeof rec.hireDate === 'number') {
            const d = new Date(Math.round((rec.hireDate - 25569) * 86400 * 1000));
            hireDateStr = d.toISOString().split('T')[0];
          } else {
            const s = String(rec.hireDate).trim();
            if (/^d{4}-d{2}-d{2}$/.test(s)) {
              hireDateStr = s;
            } else if (!isNaN(Number(s)) && Number(s) > 30000 && Number(s) < 60000) {
              const d = new Date(Math.round((Number(s) - 25569) * 86400 * 1000));
              hireDateStr = d.toISOString().split('T')[0];
            } else {
              const d = new Date(s);
              if (!isNaN(d.getTime())) hireDateStr = d.toISOString().split('T')[0];
            }
          }
        }

        const isInsured = rec.insuranceStatus === 'insured';
        const insuranceSalary = Number(rec.insuranceSalary || rec.basicSalary || 4325.0);
        const workerShare = isInsured ? Number((insuranceSalary * 0.11).toFixed(2)) : 0;
        const companyShare = isInsured ? Number((insuranceSalary * 0.1875).toFixed(2)) : 0;

        const qual = rec.qualificationCertificateStatus || (isInsured ? 'available' : 'missing');
        const birth = rec.birthCertificateStatus || (isInsured ? 'available' : 'missing');
        const idCard = rec.idCardStatus || (isInsured ? 'available' : 'missing');
        const contract = rec.contractDocStatus || (isInsured ? 'available' : 'missing');
        let missingCount = 0;
        if (qual === 'missing') missingCount++;
        if (birth === 'missing') missingCount++;
        if (idCard === 'missing') missingCount++;
        if (contract === 'missing') missingCount++;
        const completeness = Math.round(((4 - missingCount) / 4) * 100);
        const docChecklistStatus = missingCount === 0 ? 'complete' : 'incomplete';

        const rowNid = strNatId.replace(/[^0-9]/g, '');
        let autoGender = rec.gender;
        let autoDob = rec.dateOfBirth;
        if (rowNid.length === 14) {
          const c = parseInt(rowNid[0], 10) === 3 ? 2000 : 1900;
          const y = parseInt(rowNid.substring(1, 3), 10);
          const m = rowNid.substring(3, 5);
          const d = rowNid.substring(5, 7);
          if (!autoDob) autoDob = `${c + y}-${m}-${d}`;
          if (!autoGender) autoGender = parseInt(rowNid[12], 10) % 2 === 0 ? 'female' : 'male';
        }

        const targetId = existing?.id || `emp-${Date.now()}-${idx}`;

        await prisma.employee.upsert({
          where: { id: targetId },
          update: {
            firstName,
            lastName,
            arabicName,
            chineseName: rec.chineseName || null,
            email: rec.email || existing?.email || `emp.${strEmpId}@company.com`,
            phone: rec.phone || existing?.phone || null,
            departmentId: deptId,
            departmentName: deptName,
            positionId: posId,
            positionTitle: finalPosTitle,
            chinesePosition,
            hireDate: hireDateStr,
            resignationDate: rec.resignationDate || null,
            insuranceStatus: isInsured ? 'insured' : 'not_insured',
            insuranceSalary,
            workerShare,
            companyShare,
            qualificationCertificateStatus: qual,
            birthCertificateStatus: birth,
            idCardStatus: idCard,
            contractDocStatus: contract,
            documentCompletenessPercentage: completeness,
            missingDocumentsCount: missingCount,
            documentChecklistStatus: docChecklistStatus,
          },
          create: {
            id: targetId,
            employeeId: strEmpId,
            gender: autoGender || 'male',
            dateOfBirth: autoDob || null,
            firstName,
            lastName,
            arabicName,
            chineseName: rec.chineseName || null,
            nationalId: strNatId,
            email: rec.email || `emp.${strEmpId}@company.com`,
            phone: rec.phone || null,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(firstName)}`,
            departmentId: deptId,
            departmentName: deptName,
            positionId: posId,
            positionTitle: finalPosTitle,
            chinesePosition,
            hireDate: hireDateStr,
            resignationDate: rec.resignationDate || null,
            basicSalary: Number(rec.basicSalary || rec.salary || 4325.0),
            insuranceStatus: isInsured ? 'insured' : 'not_insured',
            insuranceSalary,
            workerShare,
            companyShare,
            qualificationCertificateStatus: qual,
            birthCertificateStatus: birth,
            idCardStatus: idCard,
            contractDocStatus: contract,
            documentCompletenessPercentage: completeness,
            missingDocumentsCount: missingCount,
            documentChecklistStatus: docChecklistStatus,
          },
        });

        const docRecordId = `doc-req-${strEmpId}`;
        await prisma.employeeMissingDocument.upsert({
          where: { id: docRecordId },
          update: {
            department: deptName,
            employeeName: arabicName,
            nationalId: strNatId,
            position: finalPosTitle,
            startDate: hireDateStr,
            insuranceStatus: isInsured ? 'insured' : 'not_insured',
            qualificationCert: qual,
            birthCert: birth,
            idCard: idCard,
            contract: contract,
            missingCount,
            status: docChecklistStatus,
          },
          create: {
            id: docRecordId,
            serialNo: idx + 1,
            department: deptName,
            employeeName: arabicName,
            nationalId: strNatId,
            position: finalPosTitle,
            startDate: hireDateStr,
            employeeCode: strEmpId,
            insuranceStatus: isInsured ? 'insured' : 'not_insured',
            qualificationCert: qual,
            birthCert: birth,
            idCard: idCard,
            contract: contract,
            missingCount,
            status: docChecklistStatus,
          },
        }).catch(() => {});

        insertedCount++;
      } catch (err) {
        skippedCount++;
        errors.push(`Row ${idx + 1}: ${err.message}`);
      }
    };

    const BATCH_SIZE = 25;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const slice = records.slice(i, i + BATCH_SIZE);
      await Promise.all(slice.map((rec, offset) => processRecord(rec, i + offset)));
    }

    try {
      const deptCounts = await prisma.employee.groupBy({
        by: ['departmentId'],
        _count: { id: true },
      });
      for (const dc of deptCounts) {
        if (dc.departmentId) {
          await prisma.department.update({
            where: { id: dc.departmentId },
            data: { employeeCount: dc._count.id },
          }).catch(() => {});
        }
      }
    } catch {}

    logAuditEvent({
      userName: 'Khaled Mossad',
      userRole: 'System Administrator',
      action: 'Batch Imported Employees',
      module: 'employees',
      target: `${insertedCount} employees imported`,
      status: 'success',
      details: JSON.stringify({ insertedCount, skippedCount, errorsCount: errors.length }),
    });

    return {
      success: true,
      insertedCount,
      skippedCount,
      errors,
    };
  }

  async getStats() {
    const [
      totalEmployees,
      departments,
      activeCount,
      probationCount,
      insuredCount,
      notInsuredCount,
      completeDocsCount,
      incompleteDocsCount,
    ] = await Promise.all([
      prisma.employee.count(),
      prisma.department.findMany({
        select: {
          id: true,
          code: true,
          name: true,
          nameAr: true,
          _count: { select: { employees: true } },
        },
      }),
      prisma.employee.count({ where: { employmentStatus: 'active' } }),
      prisma.employee.count({ where: { employmentStatus: 'probation' } }),
      prisma.employee.count({ where: { insuranceStatus: 'insured' } }),
      prisma.employee.count({ where: { insuranceStatus: 'not_insured' } }),
      prisma.employee.count({ where: { documentChecklistStatus: 'complete' } }),
      prisma.employee.count({ where: { documentChecklistStatus: 'incomplete' } }),
    ]);

    const byDepartment: Record<string, number> = {};
    departments.forEach(d => {
      byDepartment[d.name] = d._count.employees;
    });

    return {
      totalEmployees,
      byDepartment,
      byEmploymentStatus: {
        active: activeCount,
        probation: probationCount,
        others: totalEmployees - (activeCount + probationCount),
      },
      byInsuranceStatus: {
        insured: insuredCount,
        notInsured: notInsuredCount,
      },
      documentCompleteness: {
        complete: completeDocsCount,
        incomplete: incompleteDocsCount,
      },
    };
  }
}

export const employeesService = new EmployeesService();
