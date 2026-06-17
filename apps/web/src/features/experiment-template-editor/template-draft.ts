import type { ExperimentTemplateDto } from '@labcollab/shared'

export interface TemplateFieldDraft {
  id: string
  label: string
  required: boolean
  order: number
  defaultValue?: string
}

export interface TemplateChecklistDraft {
  id: string
  text: string
  order: number
}

export interface TemplateDraft {
  name: string
  fields: TemplateFieldDraft[]
  defaultObservations: string
  checklist: TemplateChecklistDraft[]
}

export function emptyTemplateDraft(): TemplateDraft {
  return {
    name: '',
    fields: [{ id: crypto.randomUUID(), label: 'Цель', required: true, order: 0 }],
    defaultObservations: '',
    checklist: [],
  }
}

export function templateToDraft(template: ExperimentTemplateDto): TemplateDraft {
  return {
    name: template.name,
    fields: template.fieldDefinitions.map(f => ({
      id: f.id,
      label: f.label,
      required: f.required,
      order: f.order,
      defaultValue: f.defaultValue,
    })),
    defaultObservations: template.defaultObservations ?? '',
    checklist: [...template.defaultChecklist]
      .sort((a, b) => a.order - b.order)
      .map(item => ({
        id: crypto.randomUUID(),
        text: item.text,
        order: item.order,
      })),
  }
}
