import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../db/prisma';
import { config } from '../../config/env';
import { AuthUserPayload } from '../../middleware/auth';
import { logAuditEvent } from '../audit/audit.service';

export class AuthService {
  async formatPermissions(role: string) {
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { role },
      orderBy: { module: 'asc' },
    });

    return rolePermissions.map((p) => ({
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

  formatUser(user: any) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      status: user.status,
      avatar: user.avatar,
      gender: user.gender || 'male',
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async login(email: string, password: string) {
    if (!email || !password) {
      throw { statusCode: 400, message: 'Email and password are required' };
    }

    const cleanEmail = email.trim().toLowerCase();

    // Find user (case-insensitive for SQLite)
    let user = await prisma.user.findFirst({
      where: { email: cleanEmail },
    });

    if (!user) {
      const allUsers = await prisma.user.findMany();
      user = allUsers.find((u) => u.email.toLowerCase() === cleanEmail) || null;
    }

    if (!user) {
      throw { statusCode: 401, message: 'Invalid email or password' };
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw { statusCode: 401, message: 'Invalid email or password' };
    }

    if (user.status !== 'active') {
      throw {
        statusCode: 403,
        message: `Account is ${user.status}. Please contact system administrator.`,
      };
    }

    // Update lastLogin
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate JWT Token
    const payload: AuthUserPayload = {
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      department: updatedUser.department,
    };

    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as any,
    });

    const permissions = await this.formatPermissions(updatedUser.role);

    // Auto Server-Side Audit Log
    logAuditEvent({
      userName: updatedUser.name,
      userRole: updatedUser.role === 'admin' ? 'System Administrator' : updatedUser.role,
      action: 'User Authentication & Login',
      module: 'User Administration',
      target: `Session Login (${updatedUser.email})`,
      status: 'success',
      details: { email: updatedUser.email, role: updatedUser.role },
    }).catch(() => {});

    return {
      token,
      user: this.formatUser(updatedUser),
      permissions,
    };
  }

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    if (user.status !== 'active') {
      throw {
        statusCode: 403,
        message: `Account is ${user.status}. Access denied.`,
      };
    }

    const permissions = await this.formatPermissions(user.role);

    return {
      user: this.formatUser(user),
      permissions,
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    if (!currentPassword || !newPassword) {
      throw { statusCode: 400, message: 'Current password and new password are required' };
    }

    if (newPassword.length < 6) {
      throw { statusCode: 400, message: 'New password must be at least 6 characters long' };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw { statusCode: 400, message: 'Current password is incorrect' };
    }

    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHashedPassword },
    });

    return { message: 'Password changed successfully' };
  }
}

export const authService = new AuthService();
