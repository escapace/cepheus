import { z } from 'zod'

export const preferencesSchema = z.object({
  chroma: z.number().min(0).max(1),
  colorScheme: z.enum(['dark', 'light']).optional(),
  contrast: z.number().min(0).max(1).optional(),
  lightness: z.number().min(0).max(1),
  palette: z.enum(['one', 'two']),
})

export type Preferences = z.infer<typeof preferencesSchema>
