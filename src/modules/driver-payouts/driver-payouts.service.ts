import { prisma } from '../../db/prisma';
import { driversService } from '../drivers/drivers.service';

export interface TransactionFilterQuery {
  weekPeriod?: string;
  driverId?: string;
  category?: string;
  search?: string;
}

export class DriverPayoutsService {
  /**
   * Generates a sequential receipt number formatted as REC-YYMM-XXX (e.g., REC-2610-001)
   */
  async generateReceiptNumber(dateStr?: string): Promise<string> {
    const d = dateStr ? new Date(dateStr) : new Date();
    const validDate = isNaN(d.getTime()) ? new Date() : d;
    const yy = validDate.getFullYear().toString().slice(-2);
    const mm = String(validDate.getMonth() + 1).padStart(2, '0');
    const prefix = `REC-${yy}${mm}-`;

    const latestTx = await prisma.driverPayoutTransaction.findFirst({
      where: {
        receiptNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        receiptNumber: 'desc',
      },
      select: {
        receiptNumber: true,
      },
    });

    let nextSeq = 1;
    if (latestTx?.receiptNumber) {
      const parts = latestTx.receiptNumber.split('-');
      if (parts.length === 3) {
        const lastNum = parseInt(parts[2], 10);
        if (!isNaN(lastNum)) {
          nextSeq = lastNum + 1;
        }
      }
    }

    return `${prefix}${String(nextSeq).padStart(3, '0')}`;
  }

  /**
   * Recalculates all financial totals and driver counts for a weekly summary period
   */
  async recalculateSummary(weekPeriod: string) {
    const transactions = await prisma.driverPayoutTransaction.findMany({
      where: {
        weekPeriod,
        status: { not: 'cancelled' },
      },
    });

    const uniqueDriverIds = new Set(transactions.map((t) => t.driverId));
    const totalDrivers = uniqueDriverIds.size;
    const totalOperations = transactions.length;

    let managementTotal = 0;
    let productionTotal = 0;

    for (const tx of transactions) {
      const amt = Number(tx.amount) || 0;
      if (tx.category === 'management') {
        managementTotal += amt;
      } else {
        productionTotal += amt;
      }
    }

    const totalAmount = managementTotal + productionTotal;
    const averagePayout = totalDrivers > 0 ? Math.round(totalAmount / totalDrivers) : 0;

    const existing = await prisma.weeklyPayoutSummary.findUnique({
      where: { weekPeriod },
    });

    if (existing) {
      return prisma.weeklyPayoutSummary.update({
        where: { weekPeriod },
        data: {
          totalDrivers,
          totalAmount,
          totalOperations,
          averagePayout,
          managementTotal,
          productionTotal,
        },
      });
    }

    // Auto-create summary period if it doesn't exist
    return prisma.weeklyPayoutSummary.create({
      data: {
        weekPeriod,
        weekLabel: `أسبوع ${weekPeriod}`,
        date: weekPeriod,
        totalDrivers,
        totalAmount,
        totalOperations,
        averagePayout,
        managementTotal,
        productionTotal,
        status: 'open',
      },
    });
  }

  // --- SUMMARIES METHODS ---

  async getSummaries() {
    return prisma.weeklyPayoutSummary.findMany({
      orderBy: { weekPeriod: 'desc' },
    });
  }

  async getSummary(weekPeriod: string) {
    let summary = await prisma.weeklyPayoutSummary.findUnique({
      where: { weekPeriod },
    });

    if (!summary) {
      summary = await this.recalculateSummary(weekPeriod);
    }

    return summary;
  }

  async createSummary(body: any) {
    const weekPeriod = (body.weekPeriod || body.week_period || body.date || new Date().toISOString().split('T')[0]).trim();
    const weekLabel = (body.weekLabel || body.week_label || `أسبوع ${weekPeriod}`).trim();
    const date = (body.date || weekPeriod).trim();

    const existing = await prisma.weeklyPayoutSummary.findUnique({
      where: { weekPeriod },
    });

    if (existing) {
      return existing;
    }

    return prisma.weeklyPayoutSummary.create({
      data: {
        weekPeriod,
        weekLabel,
        date,
        totalDrivers: 0,
        totalAmount: 0,
        totalOperations: 0,
        averagePayout: 0,
        managementTotal: 0,
        productionTotal: 0,
        status: 'open',
      },
    });
  }

  async updateSummaryStatus(weekPeriod: string, body: any) {
    const existing = await prisma.weeklyPayoutSummary.findUnique({
      where: { weekPeriod },
    });

    if (!existing) {
      await this.createSummary({ weekPeriod });
    }

    const isLocked = body.status === 'locked';

    return prisma.weeklyPayoutSummary.update({
      where: { weekPeriod },
      data: {
        status: isLocked ? 'locked' : 'open',
        lockedAt: isLocked ? new Date() : null,
        lockedBy: isLocked ? (body.lockedBy || body.locked_by || 'المسؤول المالي') : null,
      },
    });
  }

  // --- TRANSACTIONS METHODS ---

  async getTransactions(query: TransactionFilterQuery = {}) {
    const where: any = {};

    if (query.weekPeriod) {
      where.weekPeriod = query.weekPeriod;
    }

    if (query.driverId && query.driverId !== 'all') {
      where.driverId = query.driverId;
    }

    if (query.category && query.category !== 'all') {
      where.category = query.category;
    }

    if (query.search) {
      const q = query.search.trim();
      where.OR = [
        { driverName: { contains: q } },
        { description: { contains: q } },
        { vehiclePlate: { contains: q } },
        { receiptNumber: { contains: q } },
      ];
    }

    return prisma.driverPayoutTransaction.findMany({
      where,
      orderBy: [
        { orderIndex: 'asc' },
        { createdAt: 'asc' },
      ],
    });
  }

  async createTransaction(body: any) {
    const driverId = body.driverId || body.driver_id;
    const weekPeriod = body.weekPeriod || body.week_period;

    if (!driverId || !weekPeriod) {
      throw new Error('driverId and weekPeriod are required');
    }

    // Ensure driver exists
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
    });

    const driverName = body.driverName || body.driver_name || driver?.name || 'سائق غير محدد';
    const vehiclePlate = body.vehiclePlate || body.vehicle_plate || driver?.vehicleNumber || null;
    const date = body.date || weekPeriod || new Date().toISOString().split('T')[0];
    const amount = Number(body.amount);
    const category = body.category || driver?.defaultCategory || 'production';
    const description = body.description ?? null;
    const status = body.status || 'paid';
    const paymentMethod = body.paymentMethod || body.payment_method || 'cash';

    // Auto-create summary period if missing
    const summary = await prisma.weeklyPayoutSummary.findUnique({
      where: { weekPeriod },
    });
    if (!summary) {
      await this.createSummary({ weekPeriod, date });
    }

    // Auto-generate receipt number if missing
    const receiptNumber = body.receiptNumber || body.receipt_number || (await this.generateReceiptNumber(date));

    // Calculate orderIndex if not specified
    let orderIndex = body.orderIndex ?? body.order_index;
    if (orderIndex === undefined || orderIndex === null) {
      const count = await prisma.driverPayoutTransaction.count({
        where: { driverId, weekPeriod },
      });
      orderIndex = count;
    }

    const id = body.id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const transaction = await prisma.driverPayoutTransaction.create({
      data: {
        id,
        driverId,
        driverName,
        weekPeriod,
        date,
        amount,
        category,
        description,
        vehiclePlate,
        status,
        paymentMethod,
        receiptNumber,
        orderIndex,
      },
    });

    // Automatically recalculate weekly summary aggregations
    await this.recalculateSummary(weekPeriod);

    return transaction;
  }

  async updateTransaction(id: string, body: any) {
    const existing = await prisma.driverPayoutTransaction.findUnique({
      where: { id },
    });

    if (!existing) return null;

    const data: any = {};
    if (body.driverId !== undefined || body.driver_id !== undefined) {
      data.driverId = body.driverId ?? body.driver_id;
    }
    if (body.driverName !== undefined || body.driver_name !== undefined) {
      data.driverName = body.driverName ?? body.driver_name;
    }
    if (body.weekPeriod !== undefined || body.week_period !== undefined) {
      data.weekPeriod = body.weekPeriod ?? body.week_period;
    }
    if (body.date !== undefined) data.date = body.date;
    if (body.amount !== undefined) data.amount = Number(body.amount);
    if (body.category !== undefined) data.category = body.category;
    if (body.description !== undefined) data.description = body.description;
    if (body.vehiclePlate !== undefined || body.vehicle_plate !== undefined) {
      data.vehiclePlate = body.vehiclePlate ?? body.vehicle_plate;
    }
    if (body.status !== undefined) data.status = body.status;
    if (body.paymentMethod !== undefined || body.payment_method !== undefined) {
      data.paymentMethod = body.paymentMethod ?? body.payment_method;
    }
    if (body.receiptNumber !== undefined || body.receipt_number !== undefined) {
      data.receiptNumber = body.receiptNumber ?? body.receipt_number;
    }
    if (body.orderIndex !== undefined || body.order_index !== undefined) {
      data.orderIndex = body.orderIndex ?? body.order_index;
    }

    const updated = await prisma.driverPayoutTransaction.update({
      where: { id },
      data,
    });

    // Recalculate summary for current weekPeriod
    await this.recalculateSummary(updated.weekPeriod);

    // If weekPeriod was shifted, recalculate previous week summary too
    if (existing.weekPeriod !== updated.weekPeriod) {
      await this.recalculateSummary(existing.weekPeriod);
    }

    return updated;
  }

  async deleteTransaction(id: string) {
    const existing = await prisma.driverPayoutTransaction.findUnique({
      where: { id },
    });

    if (!existing) return false;

    await prisma.driverPayoutTransaction.delete({
      where: { id },
    });

    // Recalculate summary
    await this.recalculateSummary(existing.weekPeriod);

    return true;
  }

  /**
   * Helper to fetch full matrix representation for Excel / UI view
   */
  async getWeeklyMatrix(weekPeriod: string) {
    const [drivers, transactions, summary] = await Promise.all([
      prisma.driver.findMany({ orderBy: { code: 'asc' } }),
      this.getTransactions({ weekPeriod }),
      this.getSummary(weekPeriod),
    ]);

    let maxRows = 0;

    const columns = drivers.map((driver) => {
      const driverTxs = transactions
        .filter((t) => t.driverId === driver.id && t.status !== 'cancelled')
        .sort((a, b) => a.orderIndex - b.orderIndex);

      if (driverTxs.length > maxRows) {
        maxRows = driverTxs.length;
      }

      let totalAmount = 0;
      let managementAmount = 0;
      let productionAmount = 0;

      for (const tx of driverTxs) {
        const val = Number(tx.amount) || 0;
        totalAmount += val;
        if (tx.category === 'management') {
          managementAmount += val;
        } else {
          productionAmount += val;
        }
      }

      return {
        driver,
        transactions: driverTxs,
        totalAmount,
        operationsCount: driverTxs.length,
        managementAmount,
        productionAmount,
      };
    });

    maxRows = Math.max(maxRows, 4);

    return {
      columns,
      maxRows,
      summary,
    };
  }

  /**
   * Batch Import: Atomically process Excel sheet drivers and transactions
   */
  async batchImport(body: any) {
    const weekPeriod = (body.weekPeriod || body.week_period || new Date().toISOString().split('T')[0]).trim();
    const weekLabel = (body.weekLabel || body.week_label || `أسبوع ${weekPeriod}`).trim();
    const rawDrivers: any[] = body.drivers || [];
    const rawTransactions: any[] = body.transactions || [];

    // 1. Ensure week summary exists
    let summary = await prisma.weeklyPayoutSummary.findUnique({ where: { weekPeriod } });
    if (!summary) {
      summary = await prisma.weeklyPayoutSummary.create({
        data: {
          weekPeriod,
          weekLabel,
          date: weekPeriod,
          status: 'open',
        },
      });
    }

    // 2. Fetch existing drivers into map
    const existingDrivers = await prisma.driver.findMany();
    const driverMap = new Map<string, any>();
    existingDrivers.forEach((d) => driverMap.set(d.name.trim().toLowerCase(), d));

    let importedDriversCount = 0;

    // 3. Process drivers
    for (const d of rawDrivers) {
      if (!d.name) continue;
      const cleanName = d.name.trim();
      const key = cleanName.toLowerCase();
      if (!driverMap.has(key)) {
        const code = await driversService.generateNextCode();
        const newDriver = await prisma.driver.create({
          data: {
            id: `drv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            code,
            name: cleanName,
            phone: d.phone ?? null,
            nationalId: d.nationalId ?? d.national_id ?? null,
            vehicleNumber: d.vehicleNumber ?? d.vehicle_number ?? null,
            vehicleType: d.vehicleType ?? d.vehicle_type ?? 'ميكروباص',
            defaultCategory: d.defaultCategory ?? d.default_category ?? 'production',
            status: 'active',
            joinedDate: new Date().toISOString().split('T')[0],
          },
        });
        driverMap.set(key, newDriver);
        importedDriversCount++;
      }
    }

    // 4. Process transactions
    let importedTransactionsCount = 0;
    const driverOrderMap = new Map<string, number>();

    for (const tx of rawTransactions) {
      const rawDriverName = (tx.driverName || tx.driver_name || '').trim();
      if (!rawDriverName && !tx.driverId && !tx.driver_id) continue;

      let driver = rawDriverName ? driverMap.get(rawDriverName.toLowerCase()) : null;
      if (!driver && (tx.driverId || tx.driver_id)) {
        const targetId = tx.driverId || tx.driver_id;
        driver = existingDrivers.find((d) => d.id === targetId);
      }

      // If driver still not found, auto-create
      if (!driver && rawDriverName) {
        const code = await driversService.generateNextCode();
        driver = await prisma.driver.create({
          data: {
            id: `drv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            code,
            name: rawDriverName,
            vehicleType: 'ميكروباص',
            defaultCategory: tx.category || 'production',
            status: 'active',
            joinedDate: new Date().toISOString().split('T')[0],
          },
        });
        driverMap.set(rawDriverName.toLowerCase(), driver);
        importedDriversCount++;
      }

      if (!driver) continue;

      const driverId = driver.id;
      let currentOrder = driverOrderMap.get(driverId);
      if (currentOrder === undefined) {
        currentOrder = await prisma.driverPayoutTransaction.count({
          where: { driverId, weekPeriod },
        });
      }
      driverOrderMap.set(driverId, currentOrder + 1);

      const txDate = tx.date || weekPeriod;
      const receiptNumber = await this.generateReceiptNumber(txDate);
      const amount = Number(tx.amount) || 0;

      await prisma.driverPayoutTransaction.create({
        data: {
          id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          driverId,
          driverName: driver.name,
          weekPeriod,
          date: txDate,
          amount,
          category: tx.category || driver.defaultCategory || 'production',
          description: tx.description ?? null,
          vehiclePlate: driver.vehicleNumber ?? null,
          status: tx.status || 'paid',
          paymentMethod: tx.paymentMethod || 'cash',
          receiptNumber,
          orderIndex: currentOrder,
        },
      });
      importedTransactionsCount++;
    }

    // 5. Recalculate summary totals
    await this.recalculateSummary(weekPeriod);

    return {
      importedDriversCount,
      importedTransactionsCount,
    };
  }
}

export const driverPayoutsService = new DriverPayoutsService();
