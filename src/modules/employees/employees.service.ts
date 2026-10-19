import { prisma } from '../../db/prisma';

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
    const employeeId = data.employeeId;

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
        dateOfBirth: data.dateOfBirth || null,
        gender: data.gender || 'male',
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
      await this.deleteAll();
    }

    const defaultDept = await prisma.department.findFirst();
    const defaultPos = await prisma.position.findFirst();

    const deptMap: Record<string, string> = {
      'HR': 'dept-2',
      'PUD': 'dept-11',
      'FD': 'dept-3',
      'QC': 'dept-10',
      'SD-FISH': 'dept-5',
      'SD-POULTRY': 'dept-5',
      'PD-FISH': 'dept-4',
      'PD-POULTRY': 'dept-4',
      'PD': 'dept-4',
      'ENG': 'dept-1',
      'FIN': 'dept-3',
      'SALES': 'dept-5',
      'OPS': 'dept-8',
      'LEGAL': 'dept-7',
      'CS': 'dept-9',
      'QA': 'dept-10',
      'PROC': 'dept-11',
    };

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      try {
        if (!rec.nationalId || !rec.employeeId) {
          skippedCount++;
          errors.push(`Row ${i + 1}: Missing employeeId or nationalId`);
          continue;
        }

        const existing = await prisma.employee.findFirst({
          where: {
            OR: [{ employeeId: String(rec.employeeId) }, { nationalId: String(rec.nationalId) }],
          },
        });

        if (existing) {
          skippedCount++;
          errors.push(`Row ${i + 1}: Employee ${rec.employeeId} already exists`);
          continue;
        }

        // Find or map department
        const deptVal = String(rec.department || rec.departmentName || 'HR').trim();
        const upperDept = deptVal.toUpperCase();
        let deptId = deptMap[upperDept] || defaultDept?.id || 'dept-1';
        let deptName = deptVal;

        const deptRecord = await prisma.department.findFirst({
          where: {
            OR: [
              { id: deptVal },
              { code: deptVal },
              { name: { contains: deptVal } },
              { nameAr: { contains: deptVal } },
            ],
          },
        });
        if (deptRecord) {
          deptId = deptRecord.id;
          deptName = deptRecord.name;
        }

        // Find or map position
        const posVal = String(rec.chinesePosition || rec.positionTitle || rec.position || 'Staff').trim();
        let posId = defaultPos?.id || 'pos-01';
        let posTitle = posVal.includes('-') ? posVal.split('-')[1].trim() : posVal;
        const chinesePosition = rec.chinesePosition || posVal;

        const posRecord = await prisma.position.findFirst({
          where: {
            OR: [
              { id: posVal },
              { code: posVal },
              { title: { contains: posTitle } },
              { titleZh: { contains: posVal } },
            ],
          },
        });
        if (posRecord) {
          posId = posRecord.id;
          posTitle = posRecord.title;
        }

        // Real Names Extraction
        const rawFullName = String(
          rec.name || rec.arabicName || `${rec.firstName || ''} ${rec.lastName || ''}`.trim() || 'Employee'
        ).trim();
        const parts = rawFullName.split(/\s+/);
        const firstName = rec.firstName || parts[0] || 'Employee';
        const lastName = rec.lastName || (parts.length > 1 ? parts.slice(1).join(' ') : 'Staff');
        const arabicName = rec.arabicName || rec.name || rawFullName;

        // Parse date properly
        let hireDateStr = '2023-01-01';
        if (rec.hireDate) {
          if (typeof rec.hireDate === 'number') {
            const d = new Date(Math.round((rec.hireDate - 25569) * 86400 * 1000));
            hireDateStr = d.toISOString().split('T')[0];
          } else {
            const s = String(rec.hireDate).trim();
            if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
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

        await this.create({
          employeeId: String(rec.employeeId),
          firstName,
          lastName,
          arabicName,
          chineseName: rec.chineseName || null,
          nationalId: String(rec.nationalId),
          email: rec.email || `emp.${rec.employeeId}@company.com`,
          phone: rec.phone || null,
          departmentId: deptId,
          departmentName: deptName,
          positionId: posId,
          positionTitle: posTitle,
          chinesePosition,
          hireDate: hireDateStr,
          resignationDate: rec.resignationDate || null,
          basicSalary: Number(rec.basicSalary || rec.salary || 4325.0),
          insuranceStatus: isInsured ? 'insured' : 'not_insured',
          qualificationCertificateStatus: rec.qualificationCertificateStatus || (isInsured ? 'available' : 'missing'),
          birthCertificateStatus: rec.birthCertificateStatus || (isInsured ? 'available' : 'missing'),
          idCardStatus: rec.idCardStatus || (isInsured ? 'available' : 'missing'),
          contractDocStatus: rec.contractDocStatus || (isInsured ? 'available' : 'missing'),
        });

        insertedCount++;
      } catch (err: any) {
        skippedCount++;
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

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
