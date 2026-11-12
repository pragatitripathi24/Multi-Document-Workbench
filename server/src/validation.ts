import { z } from 'zod';

export const createAnalysisSchema = z
  .object({
    prompt: z.string().trim().min(1, 'Prompt is required').max(4000),
    mode: z.enum(['individual', 'cross_document']),
    documentIds: z
      .array(z.string().min(1))
      .min(1, 'Select at least one document'),
  })
  .superRefine((data, ctx) => {
    if (data.mode === 'individual' && data.documentIds.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Individual mode requires exactly one document',
        path: ['documentIds'],
      });
    }
    if (data.mode === 'cross_document' && data.documentIds.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Cross-document mode requires at least two documents',
        path: ['documentIds'],
      });
    }
  });
