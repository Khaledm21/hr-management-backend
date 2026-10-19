import { prisma } from '../../db/prisma';

export interface CreatePositionInput {
  id?: string;
  code: string;
  title: string;
  titleAr: string;
  titleZh: string;
  departmentId: string;
  departmentName?: string;
  minSalary?: number;
  maxSalary?: number;
  level?: string;
}

export class PositionsService {
  async findAll(departmentId?: string) {
    const where: any = {};
    if (departmentId && departmentId !== 'all') {
      where.departmentId = departmentId;
    }

    const positions = await prisma.position.findMany({
      where,
      orderBy: { code: 'asc' },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            nameZh: true,
          },
        },
      },
    });

    return positions.map(pos => ({
      ...pos,
      departmentName: pos.departmentName || pos.department?.name || '',
    }));
  }

  async findById(id: string) {
    const pos = await prisma.position.findUnique({
      where: { id },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            nameZh: true,
          },
        },
      },
    });

    if (!pos) return null;

    return {
      ...pos,
      departmentName: pos.departmentName || pos.department?.name || '',
    };
  }

  async create(data: CreatePositionInput) {
    const id = data.id || `pos-${Date.now()}`;
    let departmentName = data.departmentName;
    if (!departmentName && data.departmentId) {
      const dept = await prisma.department.findUnique({ where: { id: data.departmentId } });
      if (dept) departmentName = dept.name;
    }

    const created = await prisma.position.create({
      data: {
        id,
        code: data.code,
        title: data.title,
        titleAr: data.titleAr,
        titleZh: data.titleZh,
        departmentId: data.departmentId,
        departmentName: departmentName || null,
        minSalary: data.minSalary ? Number(data.minSalary) : 0,
        maxSalary: data.maxSalary ? Number(data.maxSalary) : 0,
        level: data.level || 'Mid',
      },
      include: {
        department: true,
      },
    });

    return {
      ...created,
      departmentName: created.departmentName || created.department?.name || '',
    };
  }

  async update(id: string, data: Partial<CreatePositionInput>) {
    const existing = await prisma.position.findUnique({ where: { id } });
    if (!existing) return null;

    let departmentName = data.departmentName;
    if (data.departmentId && !departmentName) {
      const dept = await prisma.department.findUnique({ where: { id: data.departmentId } });
      if (dept) departmentName = dept.name;
    }

    const updated = await prisma.position.update({
      where: { id },
      data: {
        ...(data.code ? { code: data.code } : {}),
        ...(data.title ? { title: data.title } : {}),
        ...(data.titleAr ? { titleAr: data.titleAr } : {}),
        ...(data.titleZh ? { titleZh: data.titleZh } : {}),
        ...(data.departmentId ? { departmentId: data.departmentId } : {}),
        ...(departmentName !== undefined ? { departmentName } : {}),
        ...(data.minSalary !== undefined ? { minSalary: Number(data.minSalary) } : {}),
        ...(data.maxSalary !== undefined ? { maxSalary: Number(data.maxSalary) } : {}),
        ...(data.level !== undefined ? { level: data.level } : {}),
      },
      include: {
        department: true,
      },
    });

    return {
      ...updated,
      departmentName: updated.departmentName || updated.department?.name || '',
    };
  }

  async delete(id: string) {
    const existing = await prisma.position.findUnique({ where: { id } });
    if (!existing) return false;

    // Check if position has employees
    const empCount = await prisma.employee.count({ where: { positionId: id } });
    if (empCount > 0) {
      throw new Error(`Cannot delete position assigned to ${empCount} employees. Reassign employees first.`);
    }

    await prisma.position.delete({ where: { id } });
    return true;
  }
}

export const positionsService = new PositionsService();
