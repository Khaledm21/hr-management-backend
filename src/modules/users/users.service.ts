import bcrypt from 'bcryptjs';
import { prisma } from '../../db/prisma';
import { MODULE_DEFINITIONS } from '../../db/seed_auth';

export class UsersService {
  private sanitizeUser(user: any) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async findAll(query: { search?: string; role?: string; status?: string }) {
    const { search, role, status } = query;
    const where: any = {};

    if (role && role !== 'all') {
      where.role = role;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { department: { contains: q } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => this.sanitizeUser(u));
  }

  async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return null;
    }

    return this.sanitizeUser(user);
  }

  async create(data: {
    name: string;
    email: string;
    password?: string;
    role?: string;
    department?: string;
    status?: string;
    avatar?: string;
    gender?: string;
  }) {
    if (!data.name || !data.email) {
      throw { statusCode: 400, message: 'Name and email are required' };
    }

    const cleanEmail = data.email.trim().toLowerCase();
    const cleanName = data.name.trim();
    const gender = data.gender === 'female' ? 'female' : 'male';

    // Check duplicate email
    const existing = await prisma.user.findFirst({
      where: { email: cleanEmail },
    });

    if (existing) {
      throw { statusCode: 409, message: 'User with this email already exists' };
    }

    const rawPassword = data.password || 'Initial@Password123';
    const passwordHash = await bcrypt.hash(rawPassword, 10);
    
    // Generate gender-aware avatar if not explicitly provided
    const defaultAvatar =
      data.avatar ||
      (gender === 'female'
        ? `https://api.dicebear.com/7.x/avataaars/svg?seed=female-${encodeURIComponent(cleanName)}&facialHairProbability=0&top=longButNotTooLong,straight01,straight02,curly,curvy,bob`
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=male-${encodeURIComponent(cleanName)}&top=shortFlat,shortRound,shortWaved,sides,theCaesar,theCaesarAndSidePart`);

    const user = await prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        passwordHash,
        role: data.role || 'hr_staff',
        department: data.department || 'Human Resources',
        status: data.status || 'active',
        avatar: defaultAvatar,
        gender,
      },
    });

    return this.sanitizeUser(user);
  }

  async update(
    id: string,
    data: {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
      department?: string;
      status?: string;
      avatar?: string;
      gender?: string;
    }
  ) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return null;
    }

    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.role !== undefined) updateData.role = data.role;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;
    if (data.gender !== undefined) updateData.gender = data.gender;

    if (data.email && data.email.trim().toLowerCase() !== user.email) {
      const cleanEmail = data.email.trim().toLowerCase();
      const existing = await prisma.user.findFirst({
        where: { email: cleanEmail },
      });
      if (existing && existing.id !== id) {
        throw { statusCode: 409, message: 'Email is already in use by another account' };
      }
      updateData.email = cleanEmail;
    }

    if (data.password && data.password.trim()) {
      if (data.password.length < 6) {
        throw { statusCode: 400, message: 'Password must be at least 6 characters long' };
      }
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return this.sanitizeUser(updatedUser);
  }

  async delete(id: string, requestingUserEmail?: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return null;
    }

    // Protect Master Admin from accidental deletion
    if (user.email === 'khaled.mossad@enterprise.com') {
      throw { statusCode: 403, message: 'Cannot delete the master admin account' };
    }

    if (requestingUserEmail && user.email === requestingUserEmail) {
      throw { statusCode: 400, message: 'You cannot delete your own logged-in account' };
    }

    await prisma.user.delete({
      where: { id },
    });

    return { message: 'User deleted successfully' };
  }

  // --- Role Permissions ---
  async getRolePermissions() {
    const allPermissions = await prisma.rolePermission.findMany({
      orderBy: [{ role: 'asc' }, { module: 'asc' }],
    });

    const roles = ['admin', 'hr_manager', 'hr_staff', 'dept_manager'];
    const grouped: Record<string, any[]> = {
      admin: [],
      hr_manager: [],
      hr_staff: [],
      dept_manager: [],
    };

    for (const p of allPermissions) {
      if (!grouped[p.role]) {
        grouped[p.role] = [];
      }
      grouped[p.role].push({
        module: p.module,
        label: p.label,
        view: p.canView,
        create: p.canCreate,
        edit: p.canEdit,
        delete: p.canDelete,
        approve: p.canApprove,
        export: p.canExport,
        canView: p.canView,
        canCreate: p.canCreate,
        canEdit: p.canEdit,
        canDelete: p.canDelete,
        canApprove: p.canApprove,
        canExport: p.canExport,
      });
    }

    return grouped;
  }

  async updateRolePermissions(
    role: string,
    permissions: Array<{
      module: string;
      label?: string;
      view?: boolean;
      create?: boolean;
      edit?: boolean;
      delete?: boolean;
      approve?: boolean;
      export?: boolean;
      canView?: boolean;
      canCreate?: boolean;
      canEdit?: boolean;
      canDelete?: boolean;
      canApprove?: boolean;
      canExport?: boolean;
    }>
  ) {
    const labelMap = new Map(MODULE_DEFINITIONS.map((m) => [m.module, m.label]));

    for (const p of permissions) {
      const canView = p.canView !== undefined ? p.canView : p.view !== undefined ? p.view : false;
      const canCreate = p.canCreate !== undefined ? p.canCreate : p.create !== undefined ? p.create : false;
      const canEdit = p.canEdit !== undefined ? p.canEdit : p.edit !== undefined ? p.edit : false;
      const canDelete = p.canDelete !== undefined ? p.canDelete : p.delete !== undefined ? p.delete : false;
      const canApprove = p.canApprove !== undefined ? p.canApprove : p.approve !== undefined ? p.approve : false;
      const canExport = p.canExport !== undefined ? p.canExport : p.export !== undefined ? p.export : false;
      const label = p.label || labelMap.get(p.module) || p.module;

      await prisma.rolePermission.upsert({
        where: {
          role_module: {
            role,
            module: p.module,
          },
        },
        update: {
          label,
          canView,
          canCreate,
          canEdit,
          canDelete,
          canApprove,
          canExport,
        },
        create: {
          role,
          module: p.module,
          label,
          canView,
          canCreate,
          canEdit,
          canDelete,
          canApprove,
          canExport,
        },
      });
    }

    // Return updated permissions for this role
    const updated = await prisma.rolePermission.findMany({
      where: { role },
      orderBy: { module: 'asc' },
    });

    return updated.map((p) => ({
      module: p.module,
      label: p.label,
      view: p.canView,
      create: p.canCreate,
      edit: p.canEdit,
      delete: p.canDelete,
      approve: p.canApprove,
      export: p.canExport,
      canView: p.canView,
      canCreate: p.canCreate,
      canEdit: p.canEdit,
      canDelete: p.canDelete,
      canApprove: p.canApprove,
      canExport: p.canExport,
    }));
  }
}

export const usersService = new UsersService();
