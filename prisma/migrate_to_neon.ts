import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to Neon PostgreSQL...');
  const raw = fs.readFileSync(path.join(__dirname, 'backup_production_data.json'), 'utf-8');
  const data = JSON.parse(raw);

  // 1. Departments and Positions
  console.log('Inserting departments and positions...');
  for (const dept of data.departments) {
    const { positions, ...deptData } = dept;
    await prisma.department.upsert({
      where: { id: deptData.id },
      create: {
        ...deptData,
        createdAt: deptData.createdAt ? new Date(deptData.createdAt) : new Date(),
        updatedAt: deptData.updatedAt ? new Date(deptData.updatedAt) : new Date(),
      },
      update: {
        ...deptData,
        updatedAt: new Date(),
      },
    });

    if (positions && positions.length > 0) {
      for (const pos of positions) {
        await prisma.position.upsert({
          where: { id: pos.id },
          create: {
            ...pos,
            createdAt: pos.createdAt ? new Date(pos.createdAt) : new Date(),
            updatedAt: pos.updatedAt ? new Date(pos.updatedAt) : new Date(),
          },
          update: {
            ...pos,
            updatedAt: new Date(),
          },
        });
      }
    }
  }
  console.log('Departments & positions inserted successfully.');

  // 2. Employees (277 employees)
  console.log('Inserting employees: ' + data.employees.length);
  for (const emp of data.employees) {
    const { department, position, ...empData } = emp;
    await prisma.employee.upsert({
      where: { id: empData.id },
      create: {
        ...empData,
        createdAt: empData.createdAt ? new Date(empData.createdAt) : new Date(),
        updatedAt: empData.updatedAt ? new Date(empData.updatedAt) : new Date(),
      },
      update: {
        ...empData,
        updatedAt: new Date(),
      },
    });
  }
  console.log('Employees inserted successfully.');

  // 3. Missing Documents (199 records)
  console.log('Inserting missing docs: ' + data.missingDocs.length);
  for (const doc of data.missingDocs) {
    await prisma.employeeMissingDocument.upsert({
      where: { id: doc.id },
      create: {
        ...doc,
        createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
        updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
      },
      update: {
        ...doc,
        updatedAt: new Date(),
      },
    });
  }
  console.log('Missing docs inserted successfully.');

  // 4. Drivers (14 drivers)
  if (data.drivers && data.drivers.length > 0) {
    console.log('Inserting drivers: ' + data.drivers.length);
    for (const d of data.drivers) {
      await prisma.driver.upsert({
        where: { id: d.id },
        create: {
          ...d,
          createdAt: d.createdAt ? new Date(d.createdAt) : new Date(),
          updatedAt: d.updatedAt ? new Date(d.updatedAt) : new Date(),
        },
        update: {
          ...d,
          updatedAt: new Date(),
        },
      });
    }
    console.log('Drivers inserted successfully.');
  }

  // 5. Weekly Payouts (2 records)
  if (data.weeklyPayouts && data.weeklyPayouts.length > 0) {
    console.log('Inserting weekly payouts: ' + data.weeklyPayouts.length);
    for (const w of data.weeklyPayouts) {
      await prisma.weeklyPayoutSummary.upsert({
        where: { weekPeriod: w.weekPeriod },
        create: {
          ...w,
          lockedAt: w.lockedAt ? new Date(w.lockedAt) : null,
          createdAt: w.createdAt ? new Date(w.createdAt) : new Date(),
          updatedAt: w.updatedAt ? new Date(w.updatedAt) : new Date(),
        },
        update: {
          ...w,
          updatedAt: new Date(),
        },
      });
    }
    console.log('Weekly payouts inserted successfully.');
  }

  // 6. Driver Payout Transactions (64 records)
  if (data.driverPayouts && data.driverPayouts.length > 0) {
    console.log('Inserting driver payout transactions: ' + data.driverPayouts.length);
    for (const tx of data.driverPayouts) {
      await prisma.driverPayoutTransaction.upsert({
        where: { id: tx.id },
        create: {
          ...tx,
          createdAt: tx.createdAt ? new Date(tx.createdAt) : new Date(),
          updatedAt: tx.updatedAt ? new Date(tx.updatedAt) : new Date(),
        },
        update: {
          ...tx,
          updatedAt: new Date(),
        },
      });
    }
    console.log('Driver payout transactions inserted successfully.');
  }

  // 7. Users (6 users)
  if (data.users && data.users.length > 0) {
    console.log('Inserting users: ' + data.users.length);
    for (const u of data.users) {
      await prisma.user.upsert({
        where: { id: u.id },
        create: {
          ...u,
          lastLogin: u.lastLogin ? new Date(u.lastLogin) : null,
          createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
          updatedAt: u.updatedAt ? new Date(u.updatedAt) : new Date(),
        },
        update: {
          ...u,
          updatedAt: new Date(),
        },
      });
    }
    console.log('Users inserted successfully.');
  }

  // 8. Role Permissions (52 records)
  if (data.rolePermissions && data.rolePermissions.length > 0) {
    console.log('Inserting role permissions: ' + data.rolePermissions.length);
    for (const rp of data.rolePermissions) {
      await prisma.rolePermission.upsert({
        where: { id: rp.id },
        create: {
          ...rp,
          createdAt: rp.createdAt ? new Date(rp.createdAt) : new Date(),
          updatedAt: rp.updatedAt ? new Date(rp.updatedAt) : new Date(),
        },
        update: {
          ...rp,
          updatedAt: new Date(),
        },
      });
    }
    console.log('Role permissions inserted successfully.');
  }

  console.log('ALL DATA MIGRATED TO NEON POSTGRESQL SUCCESSFULLY!');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
