import { z } from 'zod';

export const ToggleMissingDocumentSchema = z.object({
  body: z.object({
    documentType: z.enum(['qualificationCert', 'birthCert', 'idCard', 'contract']),
    status: z.enum(['missing', 'available']).optional(),
  }),
});

export const ImportSocialInsuranceSchema = z.object({
  body: z.object({
    records: z.array(z.record(z.any())).min(1),
  }),
});

export const ImportMissingDocumentsSchema = z.object({
  body: z.object({
    records: z.array(z.record(z.any())).min(1),
  }),
});
