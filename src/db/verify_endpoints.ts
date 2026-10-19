import { app } from '../app';
import http from 'http';

async function testEndpoints() {
  console.log('🧪 Starting API Endpoints Verification...');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5002, () => resolve()));
  const baseUrl = 'http://localhost:5002/api';

  try {
    // 1. Health
    console.log('\n--- 1. Testing GET /api/health ---');
    const healthRes: any = await fetch(`${baseUrl}/health`).then((r) => r.json());
    console.log('Health:', healthRes);
    if (!healthRes.success || healthRes.metrics.drivers !== 14) {
      throw new Error('Health check failed or unexpected driver count');
    }

    // 2. Drivers List
    console.log('\n--- 2. Testing GET /api/drivers ---');
    const driversRes: any = await fetch(`${baseUrl}/drivers`).then((r) => r.json());
    console.log(`Drivers Count: ${driversRes.data.length}, First: ${driversRes.data[0].name} (${driversRes.data[0].code})`);
    if (driversRes.data.length !== 14) throw new Error('Expected 14 drivers');

    // 3. Driver by ID
    console.log('\n--- 3. Testing GET /api/drivers/drv-1 ---');
    const singleDriverRes: any = await fetch(`${baseUrl}/drivers/drv-1`).then((r) => r.json());
    console.log(`Driver drv-1: ${singleDriverRes.data.name}`);
    if (singleDriverRes.data.code !== 'DRV-01') throw new Error('Driver code mismatch');

    // 4. Create Driver (sequential code test)
    console.log('\n--- 4. Testing POST /api/drivers (Sequential DRV-15) ---');
    const createDriverRes: any = await fetch(`${baseUrl}/drivers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'محمود عبد الفتاح',
        phone: '01011122233',
        vehicleNumber: 'ط ك ل 9988',
        vehicleType: 'ميكروباص',
        defaultCategory: 'production',
      }),
    }).then((r) => r.json());
    console.log('Created Driver:', createDriverRes.data);
    if (createDriverRes.data.code !== 'DRV-15') throw new Error(`Expected DRV-15, got ${createDriverRes.data.code}`);
    const newDriverId = createDriverRes.data.id;

    // 5. Update Driver
    console.log('\n--- 5. Testing PUT /api/drivers/:id ---');
    const updateDriverRes: any = await fetch(`${baseUrl}/drivers/${newDriverId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notes: 'ملاحظة محدثة للاختبار',
      }),
    }).then((r) => r.json());
    console.log('Updated Driver Note:', updateDriverRes.data.notes);

    // 6. Delete Driver
    console.log('\n--- 6. Testing DELETE /api/drivers/:id ---');
    const delDriverRes: any = await fetch(`${baseUrl}/drivers/${newDriverId}`, {
      method: 'DELETE',
    }).then((r) => r.json());
    console.log('Delete Driver:', delDriverRes);

    // 7. Summaries List
    console.log('\n--- 7. Testing GET /api/driver-payouts/summaries ---');
    const summariesRes: any = await fetch(`${baseUrl}/driver-payouts/summaries`).then((r) => r.json());
    console.log(`Summaries count: ${summariesRes.data.length}`);
    const week20261012 = summariesRes.data.find((s: any) => s.weekPeriod === '2026-10-12');
    console.log('Week 2026-10-12 Summary:', {
      totalAmount: week20261012.totalAmount,
      totalDrivers: week20261012.totalDrivers,
      totalOperations: week20261012.totalOperations,
      managementTotal: week20261012.managementTotal,
      productionTotal: week20261012.productionTotal,
    });
    if (week20261012.totalAmount !== 108595) throw new Error('Expected totalAmount 108595');

    // 8. Single Summary
    console.log('\n--- 8. Testing GET /api/driver-payouts/summaries/2026-10-12 ---');
    const singleSummaryRes: any = await fetch(`${baseUrl}/driver-payouts/summaries/2026-10-12`).then((r) => r.json());
    console.log('Single summary status:', singleSummaryRes.data.status);

    // 9. Lock / Unlock Summary
    console.log('\n--- 9. Testing PUT /api/driver-payouts/summaries/2026-10-12/status ---');
    const lockRes: any = await fetch(`${baseUrl}/driver-payouts/summaries/2026-10-12/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'locked', lockedBy: 'المدير المالي' }),
    }).then((r) => r.json());
    console.log('Locked status:', lockRes.data.status, lockRes.data.lockedBy);

    // Unlock back
    await fetch(`${baseUrl}/driver-payouts/summaries/2026-10-12/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'open' }),
    });

    // 10. Filtered Transactions
    console.log('\n--- 10. Testing GET /api/driver-payouts/transactions ---');
    const txsRes: any = await fetch(`${baseUrl}/driver-payouts/transactions?weekPeriod=2026-10-12`).then((r) => r.json());
    console.log(`Transactions in 2026-10-12: ${txsRes.data.length}`);
    if (txsRes.data.length !== 32) throw new Error(`Expected 32 transactions, got ${txsRes.data.length}`);

    // 11. Create Transaction (check receipt number REC-YYMM-XXX and auto recalculation)
    console.log('\n--- 11. Testing POST /api/driver-payouts/transactions ---');
    const createTxRes: any = await fetch(`${baseUrl}/driver-payouts/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        driverId: 'drv-1',
        weekPeriod: '2026-10-12',
        date: '2026-10-12',
        amount: 500,
        category: 'management',
        description: 'مشوار إداري إضافي تجريبي',
      }),
    }).then((r) => r.json());
    console.log('Created Tx:', createTxRes.data.id, createTxRes.data.receiptNumber);
    if (!createTxRes.data.receiptNumber.startsWith('REC-')) throw new Error('Receipt number invalid');

    // Check updated summary totalAmount should be 108595 + 500 = 109095
    const updatedSummaryAfterAdd: any = await fetch(`${baseUrl}/driver-payouts/summaries/2026-10-12`).then((r) => r.json());
    console.log('Summary after add:', updatedSummaryAfterAdd.data.totalAmount);
    if (updatedSummaryAfterAdd.data.totalAmount !== 109095) throw new Error('Recalculation after add failed');

    // 12. Update Transaction
    console.log('\n--- 12. Testing PUT /api/driver-payouts/transactions/:id ---');
    const newTxId = createTxRes.data.id;
    await fetch(`${baseUrl}/driver-payouts/transactions/${newTxId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 1000 }),
    }).then((r) => r.json());
    const updatedSummaryAfterEdit: any = await fetch(`${baseUrl}/driver-payouts/summaries/2026-10-12`).then((r) => r.json());
    console.log('Summary after edit (now 108595 + 1000 = 109595):', updatedSummaryAfterEdit.data.totalAmount);
    if (updatedSummaryAfterEdit.data.totalAmount !== 109595) throw new Error('Recalculation after edit failed');

    // 13. Delete Transaction
    console.log('\n--- 13. Testing DELETE /api/driver-payouts/transactions/:id ---');
    await fetch(`${baseUrl}/driver-payouts/transactions/${newTxId}`, {
      method: 'DELETE',
    }).then((r) => r.json());
    const updatedSummaryAfterDel: any = await fetch(`${baseUrl}/driver-payouts/summaries/2026-10-12`).then((r) => r.json());
    console.log('Summary after delete (back to 108595):', updatedSummaryAfterDel.data.totalAmount);
    if (updatedSummaryAfterDel.data.totalAmount !== 108595) throw new Error('Recalculation after delete failed');

    // 14. Matrix View
    console.log('\n--- 14. Testing GET /api/driver-payouts/matrix/2026-10-12 ---');
    const matrixRes: any = await fetch(`${baseUrl}/driver-payouts/matrix/2026-10-12`).then((r) => r.json());
    console.log(`Matrix Columns count: ${matrixRes.data.columns.length}, maxRows: ${matrixRes.data.maxRows}`);

    // 15. Batch Import Endpoint
    console.log('\n--- 15. Testing POST /api/driver-payouts/batch-import ---');
    const batchImportRes: any = await fetch(`${baseUrl}/driver-payouts/batch-import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weekPeriod: '2026-10-26',
        weekLabel: 'Monday, October 26, 2026',
        drivers: [
          { name: 'احمد فريد', vehicleType: 'ميكروباص', defaultCategory: 'management' },
          { name: 'سائق تجريبي جديد', vehicleType: 'ميكروباص', defaultCategory: 'production' },
        ],
        transactions: [
          { driverName: 'احمد فريد', amount: 3000, category: 'management', date: '2026-10-26' },
          { driverName: 'سائق تجريبي جديد', amount: 4500, category: 'production', date: '2026-10-26' },
        ],
      }),
    }).then((r) => r.json());
    console.log('Batch Import Result:', batchImportRes);
    if (batchImportRes.importedTransactionsCount !== 2) {
      throw new Error(`Expected 2 imported transactions, got ${batchImportRes.importedTransactionsCount}`);
    }

    // Clean up test batch import week
    const testWeekTxs: any = await fetch(`${baseUrl}/driver-payouts/transactions?weekPeriod=2026-10-26`).then((r) => r.json());
    for (const tx of testWeekTxs.data) {
      await fetch(`${baseUrl}/driver-payouts/transactions/${tx.id}`, { method: 'DELETE' });
    }
    const testDrivers: any = await fetch(`${baseUrl}/drivers?search=تجريبي`).then((r) => r.json());
    for (const d of testDrivers.data) {
      await fetch(`${baseUrl}/drivers/${d.id}`, { method: 'DELETE' });
    }

    console.log('\n🎉 ALL 15 TESTS PASSED FLAWLESSLY!');
  } finally {
    server.close();
  }
}

testEndpoints().catch((e) => {
  console.error('❌ Test failed:', e);
  process.exit(1);
});
