import { z } from 'zod';

export const CreateSummarySchema = z.object({
  body: z.object({
    weekPeriod: z.string().optional(),
    week_period: z.string().optional(),
    weekLabel: z.string().optional(),
    week_label: z.string().optional(),
    date: z.string().optional(),
  }),
});

export const UpdateSummaryStatusSchema = z.object({
  body: z.object({
    status: z.enum(['open', 'locked']),
    lockedBy: z.string().optional().nullable(),
    locked_by: z.string().optional().nullable(),
  }),
});

export const CreateTransactionSchema = z.object({
  body: z.object({
    id: z.string().optional(),
    driverId: z.string().optional(),
    driver_id: z.string().optional(),
    driverName: z.string().optional(),
    driver_name: z.string().optional(),
    weekPeriod: z.string().optional(),
    week_period: z.string().optional(),
    date: z.string().optional(),
    amount: z.union([z.number(), z.string().transform(v => parseFloat(v))]),
    category: z.enum(['management', 'production']),
    description: z.string().optional().nullable(),
    vehiclePlate: z.string().optional().nullable(),
    vehicle_plate: z.string().optional().nullable(),
    status: z.enum(['paid', 'pending', 'cancelled']).optional().default('paid'),
    paymentMethod: z.enum(['cash', 'transfer', 'cheque']).optional().default('cash'),
    payment_method: z.enum(['cash', 'transfer', 'cheque']).optional(),
    receiptNumber: z.string().optional().nullable(),
    receipt_number: z.string().optional().nullable(),
    orderIndex: z.number().optional(),
    order_index: z.number().optional(),
  }),
});

export const UpdateTransactionSchema = z.object({
  body: z.object({
    driverId: z.string().optional(),
    driver_id: z.string().optional(),
    driverName: z.string().optional(),
    driver_name: z.string().optional(),
    weekPeriod: z.string().optional(),
    week_period: z.string().optional(),
    date: z.string().optional(),
    amount: z.union([z.number(), z.string().transform(v => parseFloat(v))]).optional(),
    category: z.enum(['management', 'production']).optional(),
    description: z.string().optional().nullable(),
    vehiclePlate: z.string().optional().nullable(),
    vehicle_plate: z.string().optional().nullable(),
    status: z.enum(['paid', 'pending', 'cancelled']).optional(),
    paymentMethod: z.enum(['cash', 'transfer', 'cheque']).optional(),
    payment_method: z.enum(['cash', 'transfer', 'cheque']).optional(),
    receiptNumber: z.string().optional().nullable(),
    receipt_number: z.string().optional().nullable(),
    orderIndex: z.number().optional(),
    order_index: z.number().optional(),
  }),
});

export const BatchImportSchema = z.object({
  body: z.object({
    weekPeriod: z.string().optional(),
    week_period: z.string().optional(),
    weekLabel: z.string().optional(),
    week_label: z.string().optional(),
    drivers: z
      .array(
        z.object({
          name: z.string().min(1, 'Driver name is required'),
          vehicleType: z.enum(['ميكروباص', 'عربية فان']).optional().nullable().default('ميكروباص'),
          vehicle_type: z.enum(['ميكروباص', 'عربية فان']).optional().nullable(),
          vehicleNumber: z.string().optional().nullable(),
          vehicle_number: z.string().optional().nullable(),
          phone: z.string().optional().nullable(),
          nationalId: z.string().optional().nullable(),
          defaultCategory: z.enum(['management', 'production']).optional(),
          default_category: z.enum(['management', 'production']).optional(),
        })
      )
      .optional()
      .default([]),
    transactions: z
      .array(
        z.object({
          driverName: z.string().optional(),
          driver_name: z.string().optional(),
          driverId: z.string().optional(),
          driver_id: z.string().optional(),
          amount: z.union([z.number(), z.string().transform((v) => parseFloat(v))]),
          category: z.enum(['management', 'production']).optional().default('production'),
          description: z.string().optional().nullable(),
          date: z.string().optional(),
          status: z.enum(['paid', 'pending', 'cancelled']).optional().default('paid'),
          paymentMethod: z.enum(['cash', 'transfer', 'cheque']).optional().default('cash'),
          payment_method: z.enum(['cash', 'transfer', 'cheque']).optional(),
        })
      )
      .optional()
      .default([]),
  }),
});
