import { prisma } from '../../db/prisma';

export class DashboardService {
  async getStats() {
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const [
      totalEmployees,
      activeEmployees,
      newEmployeesThisMonth,
      onLeaveEmployees,
      missingDocsCount,
      driverCount,
      departments,
      statusGroups,
      latestSummaryWithData,
      latestSummaryAny,
    ] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { employmentStatus: 'active' } }),
      prisma.employee.count({ where: { hireDate: { startsWith: currentMonthPrefix } } }),
      prisma.employee.count({ where: { employmentStatus: 'on_leave' } }),
      prisma.employee.count({ where: { missingDocumentsCount: { gt: 0 } } }),
      prisma.driver.count({ where: { status: 'active' } }),
      prisma.department.findMany({
        select: {
          id: true,
          code: true,
          name: true,
          nameAr: true,
          _count: { select: { employees: true } },
        },
        orderBy: { code: 'asc' },
      }),
      prisma.employee.groupBy({
        by: ['employmentStatus'],
        _count: { employmentStatus: true },
      }),
      prisma.weeklyPayoutSummary.findFirst({
        where: { totalAmount: { gt: 0 } },
        orderBy: { weekPeriod: 'desc' },
      }),
      prisma.weeklyPayoutSummary.findFirst({
        orderBy: { weekPeriod: 'desc' },
      }),
    ]);

    const activeSummary = latestSummaryWithData || latestSummaryAny;
    const driverWeeklyTotal = activeSummary ? activeSummary.totalAmount : 0;

    const headcountByDept = departments.map((d) => ({
      id: d.id,
      code: d.code,
      name: d.name,
      nameAr: d.nameAr,
      count: d._count.employees,
    }));

    const statusDistribution = statusGroups.map((g) => ({
      status: g.employmentStatus,
      count: g._count.employmentStatus,
    }));

    return {
      totalEmployees,
      activeEmployees,
      newEmployeesThisMonth,
      onLeaveEmployees,
      missingDocsCount,
      driverWeeklyTotal,
      driverCount,
      headcountByDept,
      statusDistribution,
    };
  }
}

export const dashboardService = new DashboardService();
