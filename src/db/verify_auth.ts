// Global fetch is built into Node 18+
const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting Auth & RBAC Verification Tests against Live Server...\n');

  // 1. Health check
  console.log('1️⃣ Checking /api/health...');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json();
  console.log('Health Response Status:', healthRes.status, healthData.status);
  console.log('Metrics:', healthData.metrics);
  if (!healthData.success || healthData.metrics?.users < 1) {
    throw new Error('Health check failed or users count is 0');
  }
  console.log('✅ Health check passed.\n');

  // 2. Master Admin Login
  console.log('2️⃣ Testing POST /api/auth/login with Master Admin...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'khaled.mossad@enterprise.com',
      password: 'Admin@123456',
    }),
  });
  const loginData = await loginRes.json();
  console.log('Login Response Status:', loginRes.status);
  if (!loginData.success) {
    throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
  }
  console.log('User logged in:', loginData.data.user.name, `(${loginData.data.user.role})`);
  console.log('JWT Token received:', loginData.data.token.substring(0, 30) + '...');
  console.log('Permissions count:', loginData.data.permissions.length);
  if (loginData.data.permissions.length !== 13) {
    throw new Error(`Expected 13 module permissions, got ${loginData.data.permissions.length}`);
  }
  console.log('Sample Permission:', loginData.data.permissions[0]);
  if (loginData.data.user.gender !== 'male') {
    throw new Error(`Expected gender male for master admin, got ${loginData.data.user.gender}`);
  }
  console.log('Master admin gender verified:', loginData.data.user.gender);
  console.log('✅ Master Admin login passed.\n');

  const token = loginData.data.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 3. Test GET /api/auth/me
  console.log('3️⃣ Testing GET /api/auth/me...');
  const meRes = await fetch(`${BASE_URL}/auth/me`, { headers: authHeaders });
  const meData = await meRes.json();
  console.log('Me Response Status:', meRes.status);
  if (!meData.success || meData.data.user.email !== 'khaled.mossad@enterprise.com' || meData.data.user.gender !== 'male') {
    throw new Error('GET /api/auth/me failed or gender missing');
  }
  console.log('Current user confirmed:', meData.data.user.email, 'Gender:', meData.data.user.gender);
  console.log('✅ GET /api/auth/me passed.\n');

  // 4. Test POST /api/users (Add new female user)
  console.log('4️⃣ Testing POST /api/users (Create new female user)...');
  const testUserEmail = `test.user.${Date.now()}@enterprise.com`;
  const createUserRes = await fetch(`${BASE_URL}/users`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Mona Mahmoud',
      email: testUserEmail,
      password: 'Initial@Password123',
      role: 'hr_manager',
      department: 'Human Resources',
      gender: 'female',
    }),
  });
  const createUserData = await createUserRes.json();
  console.log('Create User Status:', createUserRes.status);
  if (!createUserData.success) {
    throw new Error(`Create user failed: ${JSON.stringify(createUserData)}`);
  }
  const createdUser = createUserData.data;
  console.log('Created user:', createdUser.name, createdUser.email, `(ID: ${createdUser.id})`);
  console.log('Gender verified:', createdUser.gender);
  console.log('Avatar generated for female:', createdUser.avatar.includes('female-'));
  if (createdUser.gender !== 'female' || !createdUser.avatar.includes('female-')) {
    throw new Error('Gender-based avatar generation failed');
  }
  console.log('Password hash omitted:', createdUser.passwordHash === undefined);
  console.log('✅ POST /api/users passed.\n');

  // 5. Test GET /api/users
  console.log('5️⃣ Testing GET /api/users with filters...');
  const usersRes = await fetch(`${BASE_URL}/users?search=Mona`, { headers: authHeaders });
  const usersData = await usersRes.json();
  console.log('Users list count with search=Mona:', usersData.data.length);
  if (!usersData.success || usersData.data.length === 0 || !usersData.data[0].gender) {
    throw new Error('GET /api/users failed or gender missing');
  }
  console.log('Found user in list:', usersData.data[0].name, 'Gender:', usersData.data[0].gender);
  console.log('✅ GET /api/users passed.\n');

  // 6. Test PUT /api/users/:id
  console.log('6️⃣ Testing PUT /api/users/:id (Update user)...');
  const updateUserRes = await fetch(`${BASE_URL}/users/${createdUser.id}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Mona Mahmoud Mohamed',
      department: 'HR Operations',
      status: 'active',
    }),
  });
  const updateUserData = await updateUserRes.json();
  console.log('Update User Status:', updateUserRes.status);
  if (!updateUserData.success || updateUserData.data.name !== 'Mona Mahmoud Mohamed' || updateUserData.data.gender !== 'female') {
    throw new Error('PUT /api/users/:id failed or gender missing');
  }
  console.log('Updated user name:', updateUserData.data.name, 'Department:', updateUserData.data.department, 'Gender:', updateUserData.data.gender);
  console.log('✅ PUT /api/users/:id passed.\n');

  // 7. Test GET /api/users/roles/permissions
  console.log('7️⃣ Testing GET /api/users/roles/permissions...');
  const rolesPermsRes = await fetch(`${BASE_URL}/users/roles/permissions`, { headers: authHeaders });
  const rolesPermsData = await rolesPermsRes.json();
  console.log('Roles in permissions matrix:', Object.keys(rolesPermsData.data));
  const expectedRoles = ['admin', 'hr_manager', 'hr_staff', 'dept_manager'];
  for (const r of expectedRoles) {
    if (!rolesPermsData.data[r] || rolesPermsData.data[r].length !== 13) {
      throw new Error(`Role ${r} does not have 13 permissions`);
    }
  }
  console.log('All 4 roles verified with 13 modules each.');
  console.log('✅ GET /api/users/roles/permissions passed.\n');

  // 8. Test PUT /api/users/roles/permissions/:role
  console.log('8️⃣ Testing PUT /api/users/roles/permissions/dept_manager...');
  const updateRolePermsRes = await fetch(`${BASE_URL}/users/roles/permissions/dept_manager`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      permissions: [
        {
          module: 'leave',
          view: true,
          create: true,
          edit: true,
          delete: false,
          approve: true,
          export: true,
        },
      ],
    }),
  });
  const updateRolePermsData = await updateRolePermsRes.json();
  console.log('Update Role Permissions Status:', updateRolePermsRes.status);
  if (!updateRolePermsData.success) {
    throw new Error('PUT /api/users/roles/permissions/:role failed');
  }
  console.log('✅ PUT /api/users/roles/permissions passed.\n');

  // 9. Test Invalid Login
  console.log('9️⃣ Testing POST /api/auth/login with wrong credentials...');
  const badLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'khaled.mossad@enterprise.com',
      password: 'WrongPassword!',
    }),
  });
  console.log('Bad Login Status:', badLoginRes.status);
  if (badLoginRes.status !== 401) {
    throw new Error(`Expected 401 for bad password, got ${badLoginRes.status}`);
  }
  console.log('✅ Invalid login rejected with 401 as expected.\n');

  // 10. Test DELETE /api/users/:id
  console.log('🔟 Testing DELETE /api/users/:id (Delete created test user)...');
  const deleteRes = await fetch(`${BASE_URL}/users/${createdUser.id}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  const deleteData = await deleteRes.json();
  console.log('Delete User Status:', deleteRes.status, deleteData.message);
  if (!deleteData.success) {
    throw new Error('DELETE /api/users/:id failed');
  }
  console.log('✅ DELETE /api/users/:id passed.\n');

  console.log('🎉 ALL 10 AUTH & RBAC ENDPOINT TESTS PASSED SUCCESSFULLY! 🚀');
}

runTests().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
