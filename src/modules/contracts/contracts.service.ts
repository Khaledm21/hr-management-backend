import { prisma } from '../../db/prisma';

export interface ContractFilter {
  employeeId?: string;
  department?: string;
  status?: string;
  type?: string;
}

export class ContractsService {
  async findAll(filter: ContractFilter) {
    const where: any = {};
    if (filter.employeeId) where.employeeId = filter.employeeId;
    if (filter.department && filter.department !== 'all') where.department = filter.department;
    if (filter.status && filter.status !== 'all') where.status = filter.status;
    if (filter.type && filter.type !== 'all') where.type = filter.type;

    return prisma.contract.findMany({
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
  }

  async findById(id: string) {
    return prisma.contract.findFirst({
      where: {
        OR: [{ id }, { contractNumber: id }],
      },
      include: { employee: true },
    });
  }

  async create(data: any) {
    const id = data.id || `cnt-${Date.now()}`;
    return prisma.contract.create({
      data: {
        id,
        contractNumber: data.contractNumber || `CNT-${Date.now()}`,
        employeeId: data.employeeId,
        employeeCode: data.employeeCode,
        employeeName: data.employeeName,
        department: data.department,
        type: data.type || 'fixed_term',
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status || 'active',
        salary: Number(data.salary || 4325.0),
        noticePeriodDays: Number(data.noticePeriodDays || 30),
        renewalCount: Number(data.renewalCount || 0),
        termsSummary: data.termsSummary || null,
      },
    });
  }
}

export const contractsService = new ContractsService();
