import { z } from 'zod'

export const experimentFieldDefinitionSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1).max(200),
  required: z.boolean(),
  order: z.number().int().min(0),
  defaultValue: z.string().max(50_000).optional(),
})

export const templateChecklistItemSeedSchema = z.object({
  text: z.string().min(1).max(500),
  order: z.number().int().min(0),
})

export const experimentChecklistItemSchema = z.object({
  id: z.string().uuid(),
  text: z.string().min(1).max(500),
  done: z.boolean(),
  order: z.number().int().min(0),
})

export const experimentFieldDefinitionsSchema = z.array(experimentFieldDefinitionSchema).min(1)
export const experimentChecklistSchema = z.array(experimentChecklistItemSchema)
export const templateChecklistSeedSchema = z.array(templateChecklistItemSeedSchema)

export const fieldValuesSchema = z.record(z.string().uuid(), z.string())

export type ExperimentFieldDefinition = z.infer<typeof experimentFieldDefinitionSchema>
export type ExperimentChecklistItem = z.infer<typeof experimentChecklistItemSchema>
export type TemplateChecklistItemSeed = z.infer<typeof templateChecklistItemSeedSchema>
