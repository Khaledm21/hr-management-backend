import { Router } from 'express';
import departmentsRoutes from './modules/departments/departments.routes';
import positionsRoutes from './modules/positions/positions.routes';
import employeesRoutes from './modules/employees/employees.routes';
import insuranceRoutes from './modules/insurance/insurance.routes';
import documentsRoutes from './modules/documents/documents.routes';
import contractsRoutes from './modules/contracts/contracts.routes';
import driversRoutes from './modules/drivers/drivers.routes';
import driverPayoutsRoutes from './modules/driver-payouts/driver-payouts.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import { prisma } from './db/prisma';

const router = Router();

// Health Check
router.get('/health', async (_req, res) => {
  try {
    const [deptCount, empCount, socCount, driverCount, payoutCount] = await Promise.all([
      prisma.department.count(),
      prisma.employee.count(),
      prisma.socialInsurance.count(),
      prisma.driver.count(),
      prisma.driverPayoutTransaction.count(),
    ]);

    return res.json({
      success: true,
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      metrics: {
        departments: deptCount,
        employees: empCount,
        socialInsuranceRecords: socCount,
        drivers: driverCount,
        driverPayoutTransactions: payoutCount,
      },
    });
  } catch (error: any) {
    return res.status(503).json({
      success: false,
      status: 'DOWN',
      error: error.message,
    });
  }
});

// Modular Routes
router.use('/dashboard', dashboardRoutes);
router.use('/departments', departmentsRoutes);
router.use('/positions', positionsRoutes);
router.use('/employees', employeesRoutes);
router.use('/insurance', insuranceRoutes);
router.use('/documents', documentsRoutes);
router.use('/contracts', contractsRoutes);
router.use('/drivers', driversRoutes);
router.use('/driver-payouts', driverPayoutsRoutes);

export default router;
