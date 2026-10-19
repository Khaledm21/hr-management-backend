import { prisma } from '../../db/prisma';

export interface DriverFilterQuery {
  search?: string;
  status?: string;
  category?: string;
  defaultCategory?: string;
}

export class DriversService {
  /**
   * Helper to generate next sequential driver code: DRV-01, DRV-02, etc.
   */
  async generateNextCode(): Promise<string> {
    const drivers = await prisma.driver.findMany({
      select: { code: true },
    });

    let maxNum = 0;
    const regex = /^DRV-(\d+)$/i;

    for (const d of drivers) {
      const match = d.code.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }

    const nextNum = maxNum + 1;
    return `DRV-${String(nextNum).padStart(2, '0')}`;
  }

  /**
   * Normalize input fields to support both camelCase and snake_case
   */
  private normalizeDriverPayload(body: any) {
    return {
      name: body.name?.trim(),
      phone: body.phone ?? null,
      nationalId: body.nationalId ?? body.national_id ?? null,
      vehicleNumber: body.vehicleNumber ?? body.vehicle_number ?? null,
      vehicleType: body.vehicleType ?? body.vehicle_type ?? 'ميكروباص',
      defaultCategory: body.defaultCategory ?? body.default_category ?? 'production',
      status: body.status ?? 'active',
      joinedDate: body.joinedDate ?? body.joined_date ?? new Date().toISOString().split('T')[0],
      notes: body.notes ?? null,
    };
  }

  async findAll(query: DriverFilterQuery = {}) {
    const where: any = {};

    if (query.status && query.status !== 'all') {
      where.status = query.status;
    }

    const category = query.defaultCategory || query.category;
    if (category && category !== 'all') {
      where.defaultCategory = category;
    }

    if (query.search) {
      const q = query.search.trim();
      where.OR = [
        { name: { contains: q } },
        { code: { contains: q } },
        { phone: { contains: q } },
        { vehicleNumber: { contains: q } },
        { vehicleType: { contains: q } },
        { notes: { contains: q } },
      ];
    }

    return prisma.driver.findMany({
      where,
      orderBy: { code: 'asc' },
    });
  }

  async findById(id: string) {
    return prisma.driver.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async create(body: any) {
    const normalized = this.normalizeDriverPayload(body);
    const id = body.id || `drv-${Date.now()}`;
    const code = body.code ? body.code.trim() : await this.generateNextCode();

    return prisma.driver.create({
      data: {
        id,
        code,
        ...normalized,
      },
    });
  }

  async update(id: string, body: any) {
    const existing = await prisma.driver.findUnique({ where: { id } });
    if (!existing) return null;

    const data: any = {};
    if (body.name !== undefined) data.name = body.name.trim();
    if (body.code !== undefined) data.code = body.code.trim();
    if (body.phone !== undefined) data.phone = body.phone;
    if (body.nationalId !== undefined || body.national_id !== undefined) {
      data.nationalId = body.nationalId ?? body.national_id;
    }
    if (body.vehicleNumber !== undefined || body.vehicle_number !== undefined) {
      data.vehicleNumber = body.vehicleNumber ?? body.vehicle_number;
    }
    if (body.vehicleType !== undefined || body.vehicle_type !== undefined) {
      data.vehicleType = body.vehicleType ?? body.vehicle_type;
    }
    if (body.defaultCategory !== undefined || body.default_category !== undefined) {
      data.defaultCategory = body.defaultCategory ?? body.default_category;
    }
    if (body.status !== undefined) data.status = body.status;
    if (body.joinedDate !== undefined || body.joined_date !== undefined) {
      data.joinedDate = body.joinedDate ?? body.joined_date;
    }
    if (body.notes !== undefined) data.notes = body.notes;

    const updated = await prisma.driver.update({
      where: { id },
      data,
    });

    // If driver name or vehicle changed, keep driverName & vehiclePlate updated in transactions
    if (data.name || data.vehicleNumber) {
      await prisma.driverPayoutTransaction.updateMany({
        where: { driverId: id },
        data: {
          ...(data.name ? { driverName: data.name } : {}),
          ...(data.vehicleNumber ? { vehiclePlate: data.vehicleNumber } : {}),
        },
      });
    }

    return updated;
  }

  async delete(id: string) {
    const existing = await prisma.driver.findUnique({ where: { id } });
    if (!existing) return false;

    await prisma.driver.delete({ where: { id } });
    return true;
  }
}

export const driversService = new DriversService();
