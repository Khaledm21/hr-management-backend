import { prisma } from '../../db/prisma';

export interface AuditLogInput {
  userName: string;
  userRole?: string;
  action: string;
  module: string;
  target: string;
  ipAddress?: string;
  status?: string;
  details?: any;
}

export async function logAuditEvent(input: AuditLogInput) {
  try {
    const now = new Date();
    const formattedTimestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    return await prisma.auditLog.create({
      data: {
        timestamp: formattedTimestamp,
        userName: input.userName || 'System Operator',
        userRole: input.userRole || 'System Administrator',
        action: input.action,
        module: input.module,
        target: input.target,
        ipAddress: input.ipAddress || '127.0.0.1',
        status: input.status || 'success',
        details: typeof input.details === 'string' ? input.details : JSON.stringify(input.details || {}),
      },
    });
  } catch (err) {
    console.warn('[AuditLog] Failed to record backend audit event:', err);
  }
}
