import { prisma } from '../../db/prisma';

export interface SocialInsuranceFilter {
  search?: string;
  department?: string;
  employeeListStatus?: string;
}

export interface MissingDocumentsFilter {
  search?: string;
  department?: string;
  status?: string;
  missingDoc?: string;
}

export class InsuranceService {
  async findSocialInsurance(filter: SocialInsuranceFilter) {
    const where: any = {};

    if (filter.search) {
      const q = filter.search.trim();
      where.OR = [
        { employeeName: { contains: q } },
        { nationalId: { contains: q } },
        { insuranceNumber: { contains: q } },
        { employeeCode: { contains: q } },
      ];
    }

    if (filter.department && filter.department !== 'all') {
      where.department = filter.department;
    }

    if (filter.employeeListStatus && filter.employeeListStatus !== 'all') {
      where.employeeListStatus = filter.employeeListStatus;
    }

    return prisma.socialInsurance.findMany({
      where,
      orderBy: { serialNo: 'asc' },
    });
  }

  async getInsuranceStats() {
    const [
      totalRecords,
      foundCount,
      notFoundCount,
      totalEmployees,
      totalMissingDocs,
      incompleteDocsCount,
      completeDocsCount,
      aggregates,
    ] = await Promise.all([
      prisma.socialInsurance.count(),
      prisma.socialInsurance.count({ where: { employeeListStatus: 'found' } }),
      prisma.socialInsurance.count({ where: { employeeListStatus: 'not_found' } }),
      prisma.employee.count(),
      prisma.employeeMissingDocument.count(),
      prisma.employeeMissingDocument.count({ where: { status: 'incomplete' } }),
      prisma.employeeMissingDocument.count({ where: { status: 'complete' } }),
      prisma.socialInsurance.aggregate({
        _sum: {
          insuranceSalary: true,
          workerShare: true,
          companyShare: true,
          totalContribution: true,
        },
      }),
    ]);

    const totalInsuranceWage = aggregates._sum.insuranceSalary ?? 0;
    const totalWorkerContributions = aggregates._sum.workerShare ?? 0;
    const totalCompanyContributions = aggregates._sum.companyShare ?? 0;
    const totalContributions = aggregates._sum.totalContribution ?? (totalWorkerContributions + totalCompanyContributions);
    const notInsuredCount = Math.max(0, totalEmployees - foundCount);

    return {
      totalRecords,
      foundCount,
      notFoundCount,
      insuredCount: foundCount,
      notInsuredCount,
      totalEmployees,
      totalMissingDocs,
      incompleteDocsCount,
      completeDocsCount,
      totalInsuranceWage: Number(totalInsuranceWage.toFixed(2)),
      totalSalary: Number(totalInsuranceWage.toFixed(2)),
      totalWorkerShare: Number(totalWorkerContributions.toFixed(2)),
      totalCompanyShare: Number(totalCompanyContributions.toFixed(2)),
      totalContributions: Number(totalContributions.toFixed(2)),
      standardWage: 4325.0,
      workerRate: 0.11,
      companyRate: 0.1875,
      completenessRate: totalEmployees > 0 ? Math.round((foundCount / totalEmployees) * 100) : 0,
    };
  }

  async importSocialInsurance(records: any[], overwrite = false) {
    let insertedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    if (overwrite) {
      await prisma.socialInsurance.deleteMany({}).catch(() => {});
    }

    const existingCount = await prisma.socialInsurance.count();
    let serialNo = existingCount + 1;

    // Load existing employees to match nationalId in memory
    const allEmps = await prisma.employee.findMany({
      select: { id: true, nationalId: true, employeeId: true, departmentName: true },
    });
    const empByNationalId = new Map(allEmps.filter(e => e.nationalId).map(e => [e.nationalId, e]));

    const BATCH_SIZE = 25;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const slice = records.slice(i, i + BATCH_SIZE);
      await Promise.all(slice.map(async (r, offset) => {
        const idx = i + offset;
        try {
          if (!r.nationalId || !r.employeeName) {
            skippedCount++;
            errors.push(`Row ${idx + 1}: Missing nationalId or employeeName`);
            return;
          }

          const id = r.id || `soc-ins-${Date.now()}-${idx}`;
          const salary = Number(r.insuranceSalary || 4325.0);
          const worker = Number((salary * 0.11).toFixed(2));
          const company = Number((salary * 0.1875).toFixed(2));

          const emp = empByNationalId.get(String(r.nationalId).trim());

          await prisma.socialInsurance.create({
            data: {
              id,
              serialNo: Number(r.serialNo) || (serialNo + idx),
              nationalId: String(r.nationalId),
              employeeName: r.employeeName,
              department: r.department || (emp ? emp.departmentName : 'Operations'),
              insuranceNumber: String(r.insuranceNumber || '000000'),
              insuranceSalary: salary,
              workerShare: worker,
              companyShare: company,
              totalContribution: Number((worker + company).toFixed(2)),
              note: r.note || null,
              employeeListStatus: emp ? 'found' : 'not_found',
              employeeCode: emp ? emp.employeeId : null,
            },
          });

          if (emp) {
            await prisma.employee.update({
              where: { id: emp.id },
              data: { insuranceStatus: 'insured' },
            }).catch(() => {});
          }

          insertedCount++;
        } catch (err) {
          skippedCount++;
          errors.push(`Row ${idx + 1}: ${err.message}`);
        }
      }));
    }

    return {
      success: true,
      insertedCount,
      importedCount: insertedCount,
      skippedCount,
      errors,
    };
  }

  async findMissingDocuments(filter: MissingDocumentsFilter) {
    const where: any = {};

    if (filter.search) {
      const q = filter.search.trim();
      where.OR = [
        { employeeName: { contains: q } },
        { nationalId: { contains: q } },
        { employeeCode: { contains: q } },
        { position: { contains: q } },
      ];
    }

    if (filter.department && filter.department !== 'all') {
      where.department = filter.department;
    }

    if (filter.status && filter.status !== 'all') {
      where.status = filter.status;
    }

    if (filter.missingDoc && filter.missingDoc !== 'all') {
      if (filter.missingDoc === 'qualification') where.qualificationCert = 'missing';
      else if (filter.missingDoc === 'birth') where.birthCert = 'missing';
      else if (filter.missingDoc === 'idCard') where.idCard = 'missing';
      else if (filter.missingDoc === 'contract') where.contract = 'missing';
    }

    return prisma.employeeMissingDocument.findMany({
      where,
      orderBy: { serialNo: 'asc' },
    });
  }

  async toggleMissingDocument(id: string, documentType: string, newStatus?: string) {
    const record = await prisma.employeeMissingDocument.findFirst({
      where: {
        OR: [{ id }, { employeeCode: id }],
      },
    });

    if (!record) return null;

    const currentVal = (record as any)[documentType];
    const targetStatus = newStatus || (currentVal === 'available' ? 'missing' : 'available');

    const updatedData: any = {
      [documentType]: targetStatus,
    };

    // Calculate new missing count
    const fields = ['qualificationCert', 'birthCert', 'idCard', 'contract'];
    let count = 0;
    for (const f of fields) {
      const val = f === documentType ? targetStatus : (record as any)[f];
      if (val === 'missing') count++;
    }

    updatedData.missingCount = count;
    updatedData.status = count === 0 ? 'complete' : 'incomplete';

    const updated = await prisma.employeeMissingDocument.update({
      where: { id: record.id },
      data: updatedData,
    });

    // Also synchronize with Employee record if exists
    try {
      const emp = await prisma.employee.findFirst({
        where: { employeeId: record.employeeCode },
      });

      if (emp) {
        const empUpdate: any = {};
        if (documentType === 'qualificationCert') empUpdate.qualificationCertificateStatus = targetStatus;
        if (documentType === 'birthCert') empUpdate.birthCertificateStatus = targetStatus;
        if (documentType === 'idCard') empUpdate.idCardStatus = targetStatus;
        if (documentType === 'contract') empUpdate.contractDocStatus = targetStatus;

        empUpdate.missingDocumentsCount = count;
        empUpdate.documentCompletenessPercentage = Math.round(((4 - count) / 4) * 100);
        empUpdate.documentChecklistStatus = count === 0 ? 'complete' : 'incomplete';

        await prisma.employee.update({
          where: { id: emp.id },
          data: empUpdate,
        });
      }
    } catch (err) {
      console.warn('Could not sync employee document checklist:', err);
    }

    return updated;
  }

  async importMissingDocuments(records: any[], overwrite = false) {
    let insertedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    if (overwrite) {
      await prisma.employeeMissingDocument.deleteMany({}).catch(() => {});
    }

    const existingCount = await prisma.employeeMissingDocument.count();
    let serialNo = existingCount + 1;

    const BATCH_SIZE = 25;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const slice = records.slice(i, i + BATCH_SIZE);
      await Promise.all(slice.map(async (r, offset) => {
        const idx = i + offset;
        try {
          if (!r.employeeName || !r.employeeCode) {
            skippedCount++;
            errors.push(`Row ${idx + 1}: Missing employeeName or employeeCode`);
            return;
          }

          const id = r.id || `doc-req-${Date.now()}-${idx}`;
          const qual = r.qualificationCert || 'missing';
          const birth = r.birthCert || 'missing';
          const idCard = r.idCard || 'missing';
          const contract = r.contract || 'missing';

          let missingCount = 0;
          if (qual === 'missing') missingCount++;
          if (birth === 'missing') missingCount++;
          if (idCard === 'missing') missingCount++;
          if (contract === 'missing') missingCount++;

          await prisma.employeeMissingDocument.create({
            data: {
              id,
              serialNo: Number(r.serialNo) || (serialNo + idx),
              department: r.department || 'Operations',
              employeeName: r.employeeName,
              nationalId: String(r.nationalId || ''),
              position: r.position || 'Staff',
              startDate: r.startDate || null,
              resignationDate: r.resignationDate || null,
              employeeCode: String(r.employeeCode),
              insuranceStatus: r.insuranceStatus || 'not_insured',
              qualificationCert: qual,
              birthCert: birth,
              idCard: idCard,
              contract: contract,
              missingCount,
              notes: r.notes || null,
              status: missingCount === 0 ? 'complete' : 'incomplete',
            },
          });

          insertedCount++;
        } catch (err) {
          skippedCount++;
          errors.push(`Row ${idx + 1}: ${err.message}`);
        }
      }));
    }

    return {
      success: true,
      insertedCount,
      importedCount: insertedCount,
      skippedCount,
      errors,
    };
  }

  async deleteSocial(id: string) {
    const existing = await prisma.socialInsurance.findFirst({
      where: { OR: [{ id }, { nationalId: id }, { employeeCode: id }] },
    });
    if (!existing) return false;
    await prisma.socialInsurance.delete({ where: { id: existing.id } });
    if (existing.nationalId) {
      await prisma.employee.updateMany({
        where: { nationalId: existing.nationalId },
        data: { insuranceStatus: 'not_insured' },
      });
    }
    return true;
  }

  async bulkDeleteSocial(ids: string[]) {
    if (!ids || !ids.length) return 0;
    const toDelete = await prisma.socialInsurance.findMany({
      where: {
        OR: [{ id: { in: ids } }, { nationalId: { in: ids } }, { employeeCode: { in: ids } }],
      },
      select: { nationalId: true },
    });
    const res = await prisma.socialInsurance.deleteMany({
      where: {
        OR: [{ id: { in: ids } }, { nationalId: { in: ids } }, { employeeCode: { in: ids } }],
      },
    });
    const natIds = toDelete.map(d => d.nationalId).filter(Boolean);
    if (natIds.length > 0) {
      await prisma.employee.updateMany({
        where: { nationalId: { in: natIds } },
        data: { insuranceStatus: 'not_insured' },
      });
    }
    return res.count;
  }

  async deleteAllSocial() {
    const res = await prisma.socialInsurance.deleteMany({});
    await prisma.employee.updateMany({
      data: { insuranceStatus: 'not_insured' },
    });
    return res.count;
  }

  async deleteMissingDoc(id: string) {
    const existing = await prisma.employeeMissingDocument.findFirst({
      where: { OR: [{ id }, { employeeCode: id }, { nationalId: id }] },
    });
    if (!existing) return false;
    await prisma.employeeMissingDocument.delete({ where: { id: existing.id } });
    if (existing.nationalId || existing.employeeCode) {
      await prisma.employee.updateMany({
        where: {
          OR: [
            ...(existing.nationalId ? [{ nationalId: existing.nationalId }] : []),
            ...(existing.employeeCode ? [{ employeeId: existing.employeeCode }] : []),
          ],
        },
        data: {
          documentChecklistStatus: 'incomplete',
          documentCompletenessPercentage: 0,
          missingDocumentsCount: 4,
        },
      });
    }
    return true;
  }

  async bulkDeleteMissingDocs(ids: string[]) {
    if (!ids || !ids.length) return 0;
    const toDelete = await prisma.employeeMissingDocument.findMany({
      where: {
        OR: [{ id: { in: ids } }, { employeeCode: { in: ids } }, { nationalId: { in: ids } }],
      },
      select: { nationalId: true, employeeCode: true },
    });
    const res = await prisma.employeeMissingDocument.deleteMany({
      where: {
        OR: [{ id: { in: ids } }, { employeeCode: { in: ids } }, { nationalId: { in: ids } }],
      },
    });
    const natIds = toDelete.map(d => d.nationalId).filter(Boolean);
    const empCodes = toDelete.map(d => d.employeeCode).filter(Boolean);
    if (natIds.length > 0 || empCodes.length > 0) {
      await prisma.employee.updateMany({
        where: {
          OR: [
            ...(natIds.length ? [{ nationalId: { in: natIds } }] : []),
            ...(empCodes.length ? [{ employeeId: { in: empCodes } }] : []),
          ],
        },
        data: {
          documentChecklistStatus: 'incomplete',
          documentCompletenessPercentage: 0,
          missingDocumentsCount: 4,
        },
      });
    }
    return res.count;
  }

  async deleteAllMissingDocs() {
    const res = await prisma.employeeMissingDocument.deleteMany({});
    await prisma.employee.updateMany({
      data: {
        documentChecklistStatus: 'incomplete',
        documentCompletenessPercentage: 0,
        missingDocumentsCount: 4,
      },
    });
    return res.count;
  }
}

export const insuranceService = new InsuranceService();
