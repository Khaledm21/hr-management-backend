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
    return true;
  }

  async bulkDelete(ids: string[]) {
    if (!ids || !ids.length) return 0;
    const res = await prisma.documentRecord.deleteMany({
      where: { id: { in: ids } },
    });
    return res.count;
  }

  async deleteAll() {
    const res = await prisma.documentRecord.deleteMany({});
    return res.count;
  }
}

export const documentsService = new DocumentsService();
