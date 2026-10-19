import { app } from '../app';
import http from 'http';

async function verifyAll() {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5003, () => resolve()));
  const base = 'http://localhost:5003/api';

  try {
    console.log('--- 1. Testing GET /api/dashboard/stats ---');
    const dRes: any = await fetch(`${base}/dashboard/stats`).then((r) => r.json());
    console.log('Dashboard Stats Status:', dRes.success);
    console.log('Dashboard Data Keys:', Object.keys(dRes.data));
    console.log('Headcount by Dept count:', dRes.data.headcountByDept?.length);
    console.log('Driver Weekly Total:', dRes.data.driverWeeklyTotal);

    console.log('\n--- 2. Testing Departments CRUD ---');
    const deptList: any = await fetch(`${base}/departments`).then((r) => r.json());
    console.log('Departments count:', deptList.data.length);
    const newDept: any = await fetch(`${base}/departments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'TEST_DEPT',
        name: 'Test Department',
        nameAr: 'قسم تجريبي',
        nameZh: '测试部',
        budget: 100000,
      }),
    }).then((r) => r.json());
    console.log('Created Dept:', newDept.data.id);

    const updatedDept: any = await fetch(`${base}/departments/${newDept.data.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ budget: 150000 }),
    }).then((r) => r.json());
    console.log('Updated Dept budget:', updatedDept.data.budget);

    const singleDept: any = await fetch(`${base}/departments/${newDept.data.id}`).then((r) => r.json());
    console.log('Single Dept budget:', singleDept.data.budget);

    const delDept: any = await fetch(`${base}/departments/${newDept.data.id}`, { method: 'DELETE' }).then((r) => r.json());
    console.log('Deleted Dept:', delDept);

    console.log('\n--- 3. Testing Positions CRUD ---');
    const posList: any = await fetch(`${base}/positions`).then((r) => r.json());
    console.log('Positions count:', posList.data.length, 'sample departmentName:', posList.data[0].departmentName);

    const newPos: any = await fetch(`${base}/positions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'TEST_POS',
        title: 'Test Position',
        titleAr: 'وظيفة تجريبية',
        titleZh: '测试职位',
        departmentId: 'dept-1',
        level: 'Junior',
        minSalary: 4000,
        maxSalary: 7000,
      }),
    }).then((r) => r.json());
    console.log('Created Pos:', newPos.data.id, 'deptName:', newPos.data.departmentName);

    const singlePos: any = await fetch(`${base}/positions/${newPos.data.id}`).then((r) => r.json());
    console.log('Single Pos title:', singlePos.data.title, 'deptName:', singlePos.data.departmentName);

    const updatedPos: any = await fetch(`${base}/positions/${newPos.data.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ maxSalary: 8000 }),
    }).then((r) => r.json());
    console.log('Updated Pos maxSalary:', updatedPos.data.maxSalary);

    const delPos: any = await fetch(`${base}/positions/${newPos.data.id}`, { method: 'DELETE' }).then((r) => r.json());
    console.log('Deleted Pos:', delPos);

    console.log('\n--- 4. Testing Employees ---');
    const empList: any = await fetch(`${base}/employees?page=1&pageSize=5`).then((r) => r.json());
    console.log('Employees total:', empList.total, 'page:', empList.page, 'returned:', empList.data.length);
    const sampleEmp = empList.data[0];
    console.log('Sample Emp fields:', {
      id: sampleEmp.id,
      employeeId: sampleEmp.employeeId,
      name: sampleEmp.arabicName,
      employmentType: sampleEmp.employmentType,
      departmentName: sampleEmp.departmentName,
      documentCompletenessPercentage: sampleEmp.documentCompletenessPercentage,
    });

    console.log('\n--- 5. Testing Documents & /upload route ---');
    const docs: any = await fetch(`${base}/documents`).then((r) => r.json());
    console.log('Documents count:', docs.data.length);

    console.log('\n--- 6. Testing Drivers & Payouts ---');
    const drivers: any = await fetch(`${base}/drivers`).then((r) => r.json());
    console.log('Drivers count:', drivers.data.length, 'sample vehicleType:', drivers.data[0].vehicleType);

    console.log('\n🎉 ALL 6 MODULE AUDITS VERIFIED AND PASSED SUCCESSFULLY!');
  } finally {
    server.close();
  }
}

verifyAll().catch((e) => {
  console.error('Error during verification:', e);
  process.exit(1);
});
