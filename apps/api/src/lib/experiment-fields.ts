import type {
  ExperimentChecklistItem,
  ExperimentFieldDefinition,
  ExperimentTemplateFieldSeed,
  TemplateChecklistItemSeed,
} from '@labcollab/shared'
import { randomUUID } from 'node:crypto'

export function assignFieldIds(
  seeds: ExperimentTemplateFieldSeed[],
): ExperimentFieldDefinition[] {
  return seeds.map(seed => ({
    id: randomUUID(),
    label: seed.label,
    required: seed.required,
    order: seed.order,
    ...(seed.defaultValue !== undefined ? { defaultValue: seed.defaultValue } : {}),
  }))
}

export function buildFieldValues(
  definitions: ExperimentFieldDefinition[],
): Record<string, string> {
  const values: Record<string, string> = {}
  for (const field of definitions) {
    values[field.id] = field.defaultValue ?? ''
  }
  return values
}

export function buildChecklistFromSeed(
  seeds: TemplateChecklistItemSeed[],
): ExperimentChecklistItem[] {
  return seeds.map(seed => ({
    id: randomUUID(),
    text: seed.text,
    done: false,
    order: seed.order,
  }))
}

export function normalizeTemplateFieldDefinitions(
  fields: Array<{
    id?: string
    label: string
    required: boolean
    order: number
    defaultValue?: string
  }>,
): ExperimentFieldDefinition[] {
  return fields.map(field => ({
    id: field.id ?? randomUUID(),
    label: field.label,
    required: field.required,
    order: field.order,
    ...(field.defaultValue !== undefined ? { defaultValue: field.defaultValue } : {}),
  }))
}
