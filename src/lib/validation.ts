// Validation constants for project forms
export const PROJECT_VALIDATION = {
  PATTERN: /^[\p{L}\p{N}\s!@#$%&*()\-+='"',;.]+$/u,
  ERROR_MESSAGE: 'יכול להכיל רק אותיות, מספרים, רווחים והסימנים הבאים: !@#$%&*()-+=\'",;.',
  MAX_LENGTHS: {
    title: 100,
    summary: 200,
    description: 1000,
  },
  ERROR_MESSAGES: {
    title: {
      required: 'כותרת היא שדה חובה',
      maxLength: 'הכותרת חייבת להיות קצרה מ-100 תווים',
      pattern: 'הכותרת יכולה להכיל רק אותיות, מספרים, רווחים והסימנים הבאים: !@#$%&*()-+=\'",;.',
    },
    summary: {
      maxLength: 'הסיכום חייב להיות קצר מ-200 תווים',
      pattern: 'הסיכום יכול להכיל רק אותיות, מספרים, רווחים והסימנים הבאים: !@#$%&*()-+=\'",;.',
    },
    description: {
      maxLength: 'התיאור חייב להיות קצר מ-1000 תווים',
      pattern: 'התיאור יכול להכיל רק אותיות, מספרים, רווחים והסימנים הבאים: !@#$%&*()-+=\'",;.',
    },
  },
} as const;

// Schema for project validation
import { z } from 'zod';

export const projectSchema = z.object({
  title: z.string()
    .min(1, PROJECT_VALIDATION.ERROR_MESSAGES.title.required)
    .max(PROJECT_VALIDATION.MAX_LENGTHS.title, PROJECT_VALIDATION.ERROR_MESSAGES.title.maxLength)
    .regex(PROJECT_VALIDATION.PATTERN, PROJECT_VALIDATION.ERROR_MESSAGES.title.pattern),
  summary: z.string()
    .transform(val => val.trim())
    .refine(val => val === '' || val.length <= PROJECT_VALIDATION.MAX_LENGTHS.summary, {
      message: PROJECT_VALIDATION.ERROR_MESSAGES.summary.maxLength
    })
    .refine(val => val === '' || PROJECT_VALIDATION.PATTERN.test(val), {
      message: PROJECT_VALIDATION.ERROR_MESSAGES.summary.pattern
    })
    .optional(),
  description: z.string()
    .transform(val => val.trim())
    .refine(val => val === '' || val.length <= PROJECT_VALIDATION.MAX_LENGTHS.description, {
      message: PROJECT_VALIDATION.ERROR_MESSAGES.description.maxLength
    })
    .refine(val => val === '' || PROJECT_VALIDATION.PATTERN.test(val), {
      message: PROJECT_VALIDATION.ERROR_MESSAGES.description.pattern
    })
    .optional(),
});

export type ProjectFormData = z.infer<typeof projectSchema>; 