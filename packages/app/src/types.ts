import { z } from 'zod'

export const preferencesSchema = z.object({
  chroma: z.number().min(0).max(1),
  contrast: z.number().min(0).max(1),
  darkMode: z.boolean(),
  lightness: z.number().min(0).max(1),
  model: z.enum(['one', 'two'])
})

export type Preferences = z.infer<typeof preferencesSchema>
