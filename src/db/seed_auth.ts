import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export const MODULE_DEFINITIONS = [
  { module: 'employees', label: 'إدارة الموظفين (Employees)' },
  { module: 'documents', label: 'إدارة المستندات (Documents)' },
  { module: 'insurance', label: 'التأمينات الاجتماعية (Social Insurance)' },
  { module: 'contracts', label: 'إدارة العقود (Contracts)' },
  { module: 'attendance', label: 'الحضور والانصراف (Attendance)' },
  { module: 'leave', label: 'الإجازات والمغادرات (Leaves)' },
  { module: 'payroll', label: 'المرتبات والأجور (Payroll)' },
  { module: 'advances', label: 'السلف المالية (Advances)' },
  { module: 'approvals', label: 'الموافقات والطلبات (Approvals)' },
  { module: 'reports', label: 'التقارير والإحصائيات (Reports)' },
  { module: 'users', label: 'إدارة المستخدمين والصلاحيات (Users)' },
  { module: 'settings', label: 'إعدادات النظام (Settings)' },
  { module: 'audit_logs', label: 'سجل العمليات والرقابة (Audit Logs)' },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<
  string,
  Array<{
    module: string;
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canApprove: boolean;
    canExport: boolean;
  }>
> = {
  admin: MODULE_DEFINITIONS.map((m) => ({
    module: m.module,
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canApprove: true,
    canExport: true,
  })),

  hr_manager: [
    { module: 'employees', canView: true, canCreate: true, canEdit: true, canDelete: true, canApprove: true, canExport: true },
    { module: 'documents', canView: true, canCreate: true, canEdit: true, canDelete: true, canApprove: true, canExport: true },
    { module: 'insurance', canView: true, canCreate: true, canEdit: true, canDelete: true, canApprove: true, canExport: true },
    { module: 'contracts', canView: true, canCreate: true, canEdit: true, canDelete: true, canApprove: true, canExport: true },
    { module: 'attendance', canView: true, canCreate: true, canEdit: true, canDelete: true, canApprove: true, canExport: true },
    { module: 'leave', canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: true, canExport: true },
    { module: 'payroll', canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: true, canExport: true },
    { module: 'advances', canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: true, canExport: true },
    { module: 'approvals', canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: true, canExport: true },
    { module: 'reports', canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: true, canExport: true },
    { module: 'users', canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: false, canExport: true },
    { module: 'settings', canView: true, canCreate: false, canEdit: true, canDelete: false, canApprove: false, canExport: false },
    { module: 'audit_logs', canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: true },
  ],

  hr_staff: [
    { module: 'employees', canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: false, canExport: true },
    { module: 'documents', canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: false, canExport: true },
    { module: 'insurance', canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: false, canExport: true },
    { module: 'contracts', canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: false, canExport: true },
    { module: 'attendance', canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: false, canExport: true },
    { module: 'leave', canView: true, canCreate: true, canEdit: false, canDelete: false, canApprove: false, canExport: true },
    { module: 'payroll', canView: false, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: false },
    { module: 'advances', canView: true, canCreate: true, canEdit: false, canDelete: false, canApprove: false, canExport: false },
    { module: 'approvals', canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: false },
    { module: 'reports', canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: true },
    { module: 'users', canView: false, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: false },
    { module: 'settings', canView: false, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: false },
    { module: 'audit_logs', canView: false, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: false },
  ],

  dept_manager: [
    { module: 'employees', canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: true },
    { module: 'documents', canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: false },
    { module: 'insurance', canView: false, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: false },
    { module: 'contracts', canView: false, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: false },
    { module: 'attendance', canView: true, canCreate: true, canEdit: false, canDelete: false, canApprove: true, canExport: true },
    { module: 'leave', canView: true, canCreate: true, canEdit: false, canDelete: false, canApprove: true, canExport: true },
    { module: 'payroll', canView: false, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: false },
    { module: 'advances', canView: true, canCreate: true, canEdit: false, canDelete: false, canApprove: true, canExport: false },
    { module: 'approvals', canView: true, canCreate: true, canEdit: false, canDelete: false, canApprove: true, canExport: false },
    { module: 'reports', canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: true },
    { module: 'users', canView: false, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: false },
    { module: 'settings', canView: false, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: false },
    { module: 'audit_logs', canView: false, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: false },
  ],
};

export async function seedAuthAndPermissions() {
  console.log('🔐 Seeding Master Admin and Role Permissions...');

  // 1. Seed Core Users (with gender and roles)
  const defaultPasswordHash = await bcrypt.hash('Admin@123456', 10);

  const initialUsers = [
    {
      name: 'Khaled Mossad',
      email: 'khaled.mossad@enterprise.com',
      role: 'admin',
      department: 'Management & IT',
      gender: 'male',
      status: 'active',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=male-Khaled-Mossad&top=shortFlat,shortRound,shortWaved,sides,theCaesar,theCaesarAndSidePart',
    },
    {
      name: 'Sarah Al-Ghamdi',
      email: 'sarah.alghamdi@enterprise.com',
      role: 'hr_manager',
      department: 'Human Resources',
      gender: 'female',
      status: 'active',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=female-Sarah-AlGhamdi&facialHairProbability=0&top=longButNotTooLong,straight01,straight02,curly,curvy,bob',
    },
    {
      name: 'Noura Al-Shehri',
      email: 'noura.alshehri@enterprise.com',
      role: 'hr_staff',
      department: 'Talent Acquisition',
      gender: 'female',
      status: 'active',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=female-Noura-AlShehri&facialHairProbability=0&top=longButNotTooLong,straight01,straight02,curly,curvy,bob',
    },
    {
      name: 'Tariq Al-Mansoor',
      email: 'tariq.almansoor@enterprise.com',
      role: 'dept_manager',
      department: 'Operations & Fleet',
      gender: 'male',
      status: 'active',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=male-Tariq-AlMansoor&top=shortFlat,shortRound,shortWaved,sides,theCaesar,theCaesarAndSidePart',
    },
  ];

  for (const user of initialUsers) {
    const upserted = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        department: user.department,
        gender: user.gender,
        status: user.status,
        avatar: user.avatar,
        passwordHash: defaultPasswordHash,
      },
      create: {
        name: user.name,
        email: user.email,
        passwordHash: defaultPasswordHash,
        role: user.role,
        department: user.department,
        gender: user.gender,
        status: user.status,
        avatar: user.avatar,
      },
    });
    console.log(`👤 User seeded: ${upserted.email} (${upserted.role} - ${upserted.gender})`);
  }

  // 2. Seed Role Permissions
  const labelMap = new Map(MODULE_DEFINITIONS.map((m) => [m.module, m.label]));

  for (const [role, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    for (const perm of permissions) {
      const label = labelMap.get(perm.module) || perm.module;
      await prisma.rolePermission.upsert({
        where: {
          role_module: {
            role,
            module: perm.module,
          },
        },
        update: {
          label,
          canView: perm.canView,
          canCreate: perm.canCreate,
          canEdit: perm.canEdit,
          canDelete: perm.canDelete,
          canApprove: perm.canApprove,
          canExport: perm.canExport,
        },
        create: {
          role,
          module: perm.module,
          label,
          canView: perm.canView,
          canCreate: perm.canCreate,
          canEdit: perm.canEdit,
          canDelete: perm.canDelete,
          canApprove: perm.canApprove,
          canExport: perm.canExport,
        },
      });
    }
  }

  console.log('🛡️ All 13 modules default permissions seeded for 4 roles.');
}

if (require.main === module) {
  seedAuthAndPermissions()
    .then(() => {
      console.log('✅ Auth seeding complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Auth seeding failed:', err);
      process.exit(1);
    });
}
