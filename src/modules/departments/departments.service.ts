import { prisma } from '../../db/prisma';

export interface CreateDepartmentInput {
  id?: string;
  code: string;
  name: string;
  nameAr: string;
  nameZh: string;
  managerId?: string;
  managerName?: string;
  location?: string;
  budget?: number;
}

export class DepartmentsService {
  async findAll() {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { employees: true, positions: true },
        },
      },
      orderBy: { code: 'asc' },
    });

    return departments.map(d => ({
      id: d.id,
      code: d.code,
      name: d.name,
      nameAr: d.nameAr,
      nameZh: d.nameZh,
      managerId: d.managerId,
      managerName: d.managerName,
      employeeCount: d._count.employees > 0 ? d._count.employees : d.employeeCount,
      positionsCount: d._count.positions,
      location: d.location,
      budget: d.budget,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));
  }

  async findById(id: string) {
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        positions: true,
        _count: {
          select: { employees: true },
        },
      },
    });

    if (!department) return null;

    return {
      ...department,
      employeeCount: department._count.employees > 0 ? department._count.employees : department.employeeCount,
    };
  }

  async create(data: CreateDepartmentInput) {
    const id = data.id || `dept-${Date.now()}`;
    return prisma.department.create({
      data: {
        id,
        code: data.code,
        name: data.name,
        nameAr: data.nameAr,
        nameZh: data.nameZh,
        managerId: data.managerId || null,
        managerName: data.managerName || null,
        location: data.location || null,
        budget: data.budget ? Number(data.budget) : 0,
      },
    });
  }

  async update(id: string, data: Partial<CreateDepartmentInput>) {
    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) return null;

    return prisma.department.update({
      where: { id },
      data: {
        ...(data.code ? { code: data.code } : {}),
        ...(data.name ? { name: data.name } : {}),
        ...(data.nameAr ? { nameAr: data.nameAr } : {}),
        ...(data.nameZh ? { nameZh: data.nameZh } : {}),
        ...(data.managerId !== undefined ? { managerId: data.managerId } : {}),
        ...(data.managerName !== undefined ? { managerName: data.managerName } : {}),
        ...(data.location !== undefined ? { location: data.location } : {}),
        ...(data.budget !== undefined ? { budget: Number(data.budget) } : {}),
      },
    });
  }

  async delete(id: string) {
    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) return false;

    // Check if department has employees
    const empCount = await prisma.employee.count({ where: { departmentId: id } });
    if (empCount > 0) {
      throw new Error(`Cannot delete department with ${empCount} existing employees. Reassign employees first.`);
    }

    await prisma.position.deleteMany({ where: { departmentId: id } });
    await prisma.department.delete({ where: { id } });
    return true;
  }
}

export const departmentsService = new DepartmentsService();
