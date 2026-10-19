import { z } from 'zod';

export const CreateDriverSchema = z.object({
  body: z.object({
    id: z.string().optional(),
    code: z.string().optional(),
    name: z.string().min(1, 'اسم السائق مطلوب (Driver name is required)'),
    phone: z.string().optional().nullable(),
    nationalId: z.string().optional().nullable(),
    national_id: z.string().optional().nullable(),
    vehicleNumber: z.string().optional().nullable(),
    vehicle_number: z.string().optional().nullable(),
    vehicleType: z.enum(['ميكروباص', 'عربية فان']).optional().default('ميكروباص'),
    vehicle_type: z.enum(['ميكروباص', 'عربية فان']).optional(),
    defaultCategory: z.enum(['management', 'production']).optional().default('production'),
    default_category: z.enum(['management', 'production']).optional(),
    status: z.enum(['active', 'inactive']).optional().default('active'),
    joinedDate: z.string().optional().nullable(),
    joined_date: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

export const UpdateDriverSchema = z.object({
  body: z.object({
    code: z.string().optional(),
    name: z.string().min(1).optional(),
    phone: z.string().optional().nullable(),
    nationalId: z.string().optional().nullable(),
    national_id: z.string().optional().nullable(),
    vehicleNumber: z.string().optional().nullable(),
    vehicle_number: z.string().optional().nullable(),
    vehicleType: z.enum(['ميكروباص', 'عربية فان']).optional().nullable(),
    vehicle_type: z.enum(['ميكروباص', 'عربية فان']).optional().nullable(),
    defaultCategory: z.enum(['management', 'production']).optional(),
    default_category: z.enum(['management', 'production']).optional(),
    status: z.enum(['active', 'inactive']).optional(),
    joinedDate: z.string().optional().nullable(),
    joined_date: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});
