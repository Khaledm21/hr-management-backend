import { z } from 'zod';

export const CreateEmployeeSchema = z.object({
  body: z.object({
    employeeId: z.string().min(1, 'Employee ID is required'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    arabicName: z.string().optional().nullable(),
    chineseName: z.string().optional().nullable(),
    email: z.string().email('Invalid email address').optional().nullable(),
    phone: z.string().optional().nullable(),
    avatar: z.string().optional().nullable(),
    nationalId: z.string().min(10, 'National ID must be at least 10 characters'),
    dateOfBirth: z.string().optional().nullable(),
    gender: z.enum(['male', 'female']).optional().nullable(),
    nationality: z.string().optional().default('Egyptian'),
    address: z.string().optional().nullable(),
    emergencyContact: z.any().optional().nullable(),
    departmentId: z.string().min(1, 'Department ID is required'),
    departmentName: z.string().optional().nullable(),
    positionId: z.string().min(1, 'Position ID is required'),
    positionTitle: z.string().optional().nullable(),
    chinesePosition: z.string().optional().nullable(),
    managerId: z.string().optional().nullable(),
    managerName: z.string().optional().nullable(),
    employmentStatus: z.enum(['active', 'probation', 'on_leave', 'suspended', 'terminated']).optional().default('active'),
    employmentType: z.enum(['full_time', 'part_time', 'contract', 'contractor', 'intern']).optional().default('full_time'),
    hireDate: z.string().min(1, 'Hire date is required'),
    probationEndDate: z.string().optional().nullable(),
    resignationDate: z.string().optional().nullable(),
    workLocation: z.string().optional().default('Main Facility'),
    basicSalary: z.number().optional().default(4325.0),
    housingAllowance: z.number().optional().default(0.0),
    transportAllowance: z.number().optional().default(0.0),
    contractStatus: z.enum(['active', 'expiring_soon', 'expired', 'pending_renewal']).optional().default('active'),
    insuranceStatus: z.enum(['insured', 'not_insured']).optional().default('not_insured'),
    insuranceNumber: z.string().optional().nullable(),
    insuranceSalary: z.number().optional().nullable(),
    workerShare: z.number().optional().nullable(),
    companyShare: z.number().optional().nullable(),
    insuranceNote: z.string().optional().nullable(),
    qualificationCertificateStatus: z.enum(['missing', 'available']).optional().default('missing'),
    birthCertificateStatus: z.enum(['missing', 'available']).optional().default('missing'),
    idCardStatus: z.enum(['missing', 'available']).optional().default('missing'),
    contractDocStatus: z.enum(['missing', 'available']).optional().default('missing'),
    missingNotes: z.string().optional().nullable(),
  }),
});

export const UpdateEmployeeSchema = z.object({
  body: CreateEmployeeSchema.shape.body.partial(),
});

export const BatchImportEmployeeSchema = z.object({
  body: z.object({
    records: z.array(z.record(z.any())).min(1, 'At least one record is required'),
  }),
});
