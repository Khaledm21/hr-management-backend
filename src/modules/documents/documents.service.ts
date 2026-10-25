import { prisma } from '../../db/prisma';

export interface DocumentFilter {
  employeeId?: string;
  department?: string;
  type?: string;
  status?: string;
  search?: string;
}

export class DocumentsService {
  async findAll(filter: DocumentFilter) {
    const where: any = {};

    if (filter.employeeId) {
      where.employeeId = filter.employeeId;
    }

    if (filter.department && filter.department !== 'all') {
      where.department = filter.department;
    }

    if (filter.type && filter.type !== 'all') {
      where.type = filter.type;
    }

    if (filter.status && filter.status !== 'all') {
      where.status = filter.status;
    }

    if (filter.search) {
      const q = filter.search.trim();
      where.OR = [
        { employeeName: { contains: q } },
        { title: { contains: q } },
        { fileName: { contains: q } },
      ];
    }

    const records = await prisma.documentRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            arabicName: true,
            departmentName: true,
          },
        },
      },
    });

    return records.map(d => ({
      ...d,
      verificationDate: d.verifiedAt || null,
    }));
  }

  async findById(id: string) {
    const doc = await prisma.documentRecord.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!doc) return null;
    return {
      ...doc,
      verificationDate: doc.verifiedAt || null,
    };
  }

  async syncDocumentChecklist(employeeId: string, docType: string, status: 'available' | 'missing') {
    const docTypeToMissingField: Record<string, 'qualificationCert' | 'birthCert' | 'idCard' | 'contract'> = {
      qualification: 'qualificationCert',
      birth_certificate: 'birthCert',
      national_id: 'idCard',
      contract: 'contract',
    };

    const targetField = docTypeToMissingField[docType];
    if (!targetField || !employeeId) return;

    try {
      const targetEmployee = await prisma.employee.findFirst({
        where: {
          OR: [{ id: employeeId }, { employeeId: employeeId }],
        },
      });

      if (!targetEmployee) return;

      const missingDoc = await prisma.employeeMissingDocument.findFirst({
        where: {
          OR: [
            { employeeCode: targetEmployee.employeeId },
            { nationalId: targetEmployee.nationalId },
            { id: `doc-${targetEmployee.id}` },
          ],
        },
      });

      const fields: Array<'qualificationCert' | 'birthCert' | 'idCard' | 'contract'> = [
        'qualificationCert',
        'birthCert',
        'idCard',
        'contract',
      ];

      let missingCount = 0;
      if (missingDoc) {
        for (const f of fields) {
          const val = f === targetField ? status : (missingDoc as any)[f];
          if (val === 'missing') missingCount++;
        }

        await prisma.employeeMissingDocument.update({
          where: { id: missingDoc.id },
          data: {
            [targetField]: status,
            missingCount,
            status: missingCount === 0 ? 'complete' : 'incomplete',
            notes:
              missingCount === 0
                ? 'جميع الأوراق ومسوغات التعيين مكتملة'
                : `متبقي ${missingCount} مستند(ات) غير مكتملة`,
          },
        });
      } else {
        const currentQual = targetField === 'qualificationCert' ? status : (targetEmployee.qualificationCertificateStatus || 'missing');
        const currentBirth = targetField === 'birthCert' ? status : (targetEmployee.birthCertificateStatus || 'missing');
        const currentId = targetField === 'idCard' ? status : (targetEmployee.idCardStatus || 'missing');
        const currentCont = targetField === 'contract' ? status : (targetEmployee.contractDocStatus || 'missing');

        if (currentQual === 'missing') missingCount++;
        if (currentBirth === 'missing') missingCount++;
        if (currentId === 'missing') missingCount++;
        if (currentCont === 'missing') missingCount++;
      }

      // Update employee
      const empUpdate: any = {};
      if (targetField === 'qualificationCert') empUpdate.qualificationCertificateStatus = status;
      if (targetField === 'birthCert') empUpdate.birthCertificateStatus = status;
      if (targetField === 'idCard') empUpdate.idCardStatus = status;
      if (targetField === 'contract') empUpdate.contractDocStatus = status;

      empUpdate.missingDocumentsCount = missingCount;
      empUpdate.documentCompletenessPercentage = Math.round(((4 - missingCount) / 4) * 100);
      empUpdate.documentChecklistStatus = missingCount === 0 ? 'complete' : 'incomplete';

      await prisma.employee.update({
        where: { id: targetEmployee.id },
        data: empUpdate,
      });
    } catch (err) {
      console.warn('syncDocumentChecklist error:', err);
    }
  }

  async create(data: any, file?: Express.Multer.File) {
    const id = data.id || `doc-${Date.now()}`;

    let fileName = data.fileName || file?.originalname || 'document.pdf';
    let fileUrl = data.fileUrl || (file ? `/uploads/${file.filename}` : `/uploads/${fileName}`);
    let fileSize = data.fileSize || (file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : '1.5 MB');

    // Find employee if employeeName/department are missing
    let employeeName = data.employeeName;
    let department = data.department;
    if ((!employeeName || !department) && data.employeeId) {
      const emp = await prisma.employee.findFirst({
        where: {
          OR: [{ id: data.employeeId }, { employeeId: data.employeeId }],
        },
      });
      if (emp) {
        employeeName = emp.arabicName || `${emp.firstName} ${emp.lastName}`;
        department = emp.departmentName;
      }
    }

    const created = await prisma.documentRecord.create({
      data: {
        id,
        employeeId: data.employeeId,
        employeeName: employeeName || 'Staff Member',
        department: department || 'General',
        type: data.type || 'other',
        title: data.title || fileName,
        fileName,
        fileUrl,
        fileSize,
        status: data.status || 'under_review',
        expiryDate: data.expiryDate || null,
        uploadedAt: new Date().toISOString().split('T')[0],
        notes: data.notes || null,
      },
    });

    // Automatically synchronize with Missing Documents checklist and Employee record
    await this.syncDocumentChecklist(data.employeeId, data.type, 'available');

    return {
      ...created,
      verificationDate: created.verifiedAt || null,
    };
  }

  async verify(id: string, notes?: string, verifiedBy = 'HR Operations Auditor') {
    const existing = await prisma.documentRecord.findUnique({ where: { id } });
    if (!existing) return null;

    const updated = await prisma.documentRecord.update({
      where: { id },
      data: {
        status: 'verified',
        verifiedAt: new Date().toISOString().split('T')[0],
        verifiedBy,
        notes: notes || 'Verified against original government registry',
        rejectionReason: null,
      },
    });

    // Also ensure checklist is marked available
    if (existing.employeeId && existing.type) {
      await this.syncDocumentChecklist(existing.employeeId, existing.type, 'available');
    }

    return {
      ...updated,
      verificationDate: updated.verifiedAt || null,
    };
  }

  async reject(id: string, rejectionReason: string) {
    const existing = await prisma.documentRecord.findUnique({ where: { id } });
    if (!existing) return null;

    const updated = await prisma.documentRecord.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectionReason,
        verifiedAt: null,
        verifiedBy: null,
      },
    });

    return {
      ...updated,
      verificationDate: updated.verifiedAt || null,
    };
  }

  async delete(id: string) {
    const existing = await prisma.documentRecord.findUnique({ where: { id } });
    if (!existing) return false;
    await prisma.documentRecord.delete({ where: { id } });

    // Check if employee still has another document of this type
    if (existing.employeeId && existing.type) {
      const remaining = await prisma.documentRecord.count({
        where: { employeeId: existing.employeeId, type: existing.type },
      });
      if (remaining === 0) {
        await this.syncDocumentChecklist(existing.employeeId, existing.type, 'missing');
      }
    }

    return true;
  }

  async bulkDelete(ids: string[]) {
    if (!ids || !ids.length) return 0;
    const docs = await prisma.documentRecord.findMany({
      where: { id: { in: ids } },
    });

    const res = await prisma.documentRecord.deleteMany({
      where: { id: { in: ids } },
    });

    // Re-check remaining documents for affected employees
    for (const doc of docs) {
      if (doc.employeeId && doc.type) {
        const remaining = await prisma.documentRecord.count({
          where: { employeeId: doc.employeeId, type: doc.type },
        });
        if (remaining === 0) {
          await this.syncDocumentChecklist(doc.employeeId, doc.type, 'missing');
        }
      }
    }

    return res.count;
  }

  async deleteAll() {
    const res = await prisma.documentRecord.deleteMany({});
    return res.count;
  }
}

export const documentsService = new DocumentsService();
