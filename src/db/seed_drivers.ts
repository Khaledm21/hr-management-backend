import { prisma } from './prisma';
import { mockDrivers, mockWeeklySummaries, mockSeedTransactions } from './seed_drivers_raw';

export async function seedDriversAndPayouts() {
  console.log('🚛 Seeding Drivers & Payouts...');

  // 1. Delete in reverse dependency order
  await prisma.driverPayoutTransaction.deleteMany();
  await prisma.weeklyPayoutSummary.deleteMany();
  await prisma.driver.deleteMany();

  // 2. Insert Drivers
  console.log(`👤 Inserting ${mockDrivers.length} drivers...`);
  for (const drv of mockDrivers) {
    await prisma.driver.create({
      data: {
        id: drv.id,
        code: drv.code,
        name: drv.name,
        phone: drv.phone ?? null,
        nationalId: drv.nationalId ?? null,
        vehicleNumber: drv.vehicleNumber ?? null,
        vehicleType: drv.vehicleType ?? 'جامبو 7000',
        defaultCategory: drv.defaultCategory,
        status: drv.status,
        joinedDate: drv.joinedDate ?? null,
        notes: drv.notes ?? null,
      },
    });
  }

  // 3. Insert Weekly Summaries
  console.log(`📅 Inserting ${mockWeeklySummaries.length} weekly payout summaries...`);
  for (const s of mockWeeklySummaries) {
    await prisma.weeklyPayoutSummary.create({
      data: {
        weekPeriod: s.weekPeriod,
        weekLabel: s.weekLabel,
        date: s.date,
        totalDrivers: s.totalDrivers,
        totalAmount: s.totalAmount,
        totalOperations: s.totalOperations,
        averagePayout: s.averagePayout,
        managementTotal: s.managementTotal,
        productionTotal: s.productionTotal,
        status: s.status,
        lockedAt: s.lockedAt ? new Date(s.lockedAt) : null,
        lockedBy: s.lockedBy ?? null,
      },
    });
  }

  // 4. Insert Transactions
  console.log(`💰 Inserting ${mockSeedTransactions.length} payout transactions...`);
  for (const tx of mockSeedTransactions) {
    await prisma.driverPayoutTransaction.create({
      data: {
        id: tx.id,
        driverId: tx.driverId,
        driverName: tx.driverName,
        weekPeriod: tx.weekPeriod,
        date: tx.date,
        amount: tx.amount,
        category: tx.category,
        description: tx.description ?? null,
        vehiclePlate: tx.vehiclePlate ?? null,
        status: tx.status,
        paymentMethod: tx.paymentMethod,
        receiptNumber: tx.receiptNumber ?? null,
        orderIndex: tx.orderIndex,
        createdAt: tx.createdAt ? new Date(tx.createdAt) : new Date(),
      },
    });
  }

  console.log('✅ Drivers & Driver Payouts seeded successfully!');
}

if (require.main === module || process.argv[1]?.includes('seed_drivers')) {
  seedDriversAndPayouts()
    .catch((err) => {
      console.error('Failed to seed drivers:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
