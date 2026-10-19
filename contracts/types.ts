/**
 * Data Transfer Objects (DTOs) & Contracts for Backend Implementation
 * Compatible with Express, NestJS, Fastify, or as reference for Python Pydantic / Go structs.
 */

// 1. Employee DTOs
export interface CreateEmployeeDto {
  employeeId: string;
  firstName: string;
  lastName: string;
  arabicName?: string;
  chineseName?: string;
  email: string;
  phone: string;
  nationalId: string; // 14-digit national ID
  dateOfBirth?: string;
  gender: 'male' | 'female';
  nationality?: string;
  address?: string;
  departmentId: string;
  positionId: string;
  chinesePosition?: string;
  managerId?: string;
  employmentStatus?: 'active' | 'probation' | 'on_leave' | 'suspended' | 'terminated';
  employmentType?: 'full_time' | 'part_time' | 'contract' | 'intern';
  hireDate: string;
  probationEndDate?: string;
  basicSalary?: number;
  housingAllowance?: number;
  transportAllowance?: number;
  insuranceStatus?: 'insured' | 'not_insured';
  insuranceNumber?: string;
  insuranceSalary?: number;
}

export interface UpdateEmployeeDto extends Partial<CreateEmployeeDto> {
  resignationDate?: string;
  contractStatus?: 'active' | 'expiring_soon' | 'expired' | 'pending_renewal';
  documentCompletenessPercentage?: number;
  missingDocumentsCount?: number;
}

export interface EmployeeFilterQuery {
  search?: string;
  departmentId?: string;
  employmentStatus?: string;
  contractStatus?: string;
  insuranceStatus?: 'insured' | 'not_insured' | 'all';
  documentStatus?: 'complete' | 'incomplete' | 'all';
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

// 2. Department & Position DTOs
export interface CreateDepartmentDto {
  code: string;
  name: string;
  nameAr: string;
  nameZh: string;
  managerId?: string;
  location?: string;
  budget?: number;
}

export interface CreatePositionDto {
  code: string;
  title: string;
  titleAr: string;
  titleZh: string;
  departmentId: string;
  minSalary?: number;
  maxSalary?: number;
  level?: string;
}

// 3. Social Insurance DTOs
export interface CreateSocialInsuranceRecordDto {
  serialNo?: number;
  nationalId: string;
  employeeName: string;
  department: string;
  insuranceNumber: string;
  insuranceSalary: number;
  workerShare?: number;
  companyShare?: number;
  note?: string;
  employeeListStatus?: 'found' | 'not_found';
  employeeCode?: string;
}

export interface SocialInsuranceFilterQuery {
  search?: string;
  department?: string;
  employeeListStatus?: 'found' | 'not_found' | 'all';
}

// 4. Missing Documents DTOs
export interface MissingDocumentsFilterQuery {
  search?: string;
  department?: string;
  status?: 'incomplete' | 'complete' | 'all';
  missingDoc?: 'qualification' | 'birth' | 'idCard' | 'contract' | 'all';
}

export interface ToggleMissingDocumentDto {
  documentType: 'qualificationCert' | 'birthCert' | 'idCard' | 'contract';
  status?: 'missing' | 'available';
}

// 5. Generic Paginated API Response
export interface PaginatedApiResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
