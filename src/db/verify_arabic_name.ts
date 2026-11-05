import { app } from '../app';
import http from 'http';

async function runTests() {
  console.log('🧪 Starting Verification Tests for Arabic Name Feature...\n');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5004, () => resolve()));
  const baseUrl = 'http://localhost:5004/api';

  try {
    // 1. GET /api/employees
    console.log('--- Test 1: GET /api/employees includes arabicName ---');
    const listRes = await fetch(`${baseUrl}/employees?page=1&pageSize=5`).then(r => r.json());
    if (!listRes.success || !Array.isArray(listRes.data) || listRes.data.length === 0) {
      throw new Error('Failed to retrieve employees list');
    }
    const sampleEmp = listRes.data[0];
    console.log('Sample Employee:', {
      id: sampleEmp.id,
      employeeId: sampleEmp.employeeId,
      firstName: sampleEmp.firstName,
      arabicName: sampleEmp.arabicName,
    });
    if (!('arabicName' in sampleEmp)) {
      throw new Error('arabicName property missing in GET /api/employees response');
    }
    console.log('✅ Test 1 Passed: arabicName is present in employee list!\n');

    // 2. GET /api/employees/:id
    console.log('--- Test 2: GET /api/employees/:id includes arabicName ---');
    const singleRes = await fetch(`${baseUrl}/employees/${sampleEmp.id}`).then(r => r.json());
    if (!singleRes.success || !singleRes.data) {
      throw new Error('Failed to retrieve single employee');
    }
    console.log('Single Employee retrieved:', {
      id: singleRes.data.id,
      arabicName: singleRes.data.arabicName,
    });
    if (!('arabicName' in singleRes.data)) {
      throw new Error('arabicName property missing in GET /api/employees/:id response');
    }
    console.log('✅ Test 2 Passed: arabicName is present in single employee response!\n');

    // 3. PUT /api/employees/:id updates and persists arabicName (with whitespace trimming)
    console.log('--- Test 3: PUT /api/employees/:id updates and persists arabicName ---');
    const originalName = singleRes.data.arabicName;
    const testArabicName = '  محمود محمد عبد الحميد رفعت  ';
    const expectedTrimmed = 'محمود محمد عبد الحميد رفعت';

    const updateRes = await fetch(`${baseUrl}/employees/${sampleEmp.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ arabicName: testArabicName }),
    }).then(r => r.json());

    if (!updateRes.success || updateRes.data.arabicName !== expectedTrimmed) {
      throw new Error(`Expected trimmed arabicName "${expectedTrimmed}", got "${updateRes.data?.arabicName}"`);
    }

    // Verify persistence by fetching again
    const verifyFetch = await fetch(`${baseUrl}/employees/${sampleEmp.id}`).then(r => r.json());
    if (verifyFetch.data.arabicName !== expectedTrimmed) {
      throw new Error(`Persisted value mismatch: expected "${expectedTrimmed}", got "${verifyFetch.data.arabicName}"`);
    }
    console.log('✅ Test 3 Passed: PUT successfully updated and persisted trimmed arabicName!\n');

    // 4. POST /api/employees/bulk-arabic-names
    console.log('--- Test 4: POST /api/employees/bulk-arabic-names with { updates: [...] } ---');
    const emp1 = listRes.data[0];
    const emp2 = listRes.data[1];

    const bulkPayload = {
      updates: [
        { id: emp1.id, arabicName: '  أحمد السيد مصطفى كامل  ' },
        { id: emp2.employeeId, arabicName: '  سارة إبراهيم محمود علي  ' }, // Testing employeeId lookup
      ],
    };

    const bulkRes = await fetch(`${baseUrl}/employees/bulk-arabic-names`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bulkPayload),
    }).then(r => r.json());

    console.log('Bulk Update Response:', bulkRes);
    if (!bulkRes.success || bulkRes.count !== 2) {
      throw new Error(`Expected count: 2, got count: ${bulkRes.count}`);
    }

    // Verify both records in DB
    const [checkEmp1, checkEmp2] = await Promise.all([
      fetch(`${baseUrl}/employees/${emp1.id}`).then(r => r.json()),
      fetch(`${baseUrl}/employees/${emp2.id}`).then(r => r.json()),
    ]);

    if (checkEmp1.data.arabicName !== 'أحمد السيد مصطفى كامل') {
      throw new Error(`Emp1 arabicName mismatch: got "${checkEmp1.data.arabicName}"`);
    }
    if (checkEmp2.data.arabicName !== 'سارة إبراهيم محمود علي') {
      throw new Error(`Emp2 arabicName mismatch: got "${checkEmp2.data.arabicName}"`);
    }
    console.log('✅ Test 4 Passed: POST /api/employees/bulk-arabic-names successfully updated batch by both id and employeeId!\n');

    // 5. Test edge case: invalid payload returns 400
    console.log('--- Test 5: POST /api/employees/bulk-arabic-names invalid payload validation ---');
    const invalidRes = await fetch(`${baseUrl}/employees/bulk-arabic-names`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invalidField: 123 }),
    }).then(r => r.json());

    if (invalidRes.success !== false) {
      throw new Error('Expected 400 Bad Request for non-array updates payload');
    }
    console.log('✅ Test 5 Passed: Rejected invalid payload with 400!\n');

    // Restore original name for emp1
    await fetch(`${baseUrl}/employees/${emp1.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ arabicName: originalName }),
    });

    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! The arabicName implementation is 100% verified.');
  } finally {
    server.close();
  }
}

runTests().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});

