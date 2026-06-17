import type { TemplateChecklistItemSeed } from './experiment-fields'

export interface ExperimentTemplateFieldSeed {
  label: string
  required: boolean
  order: number
  defaultValue?: string
}

export const defaultExperimentTemplateSeed = {
  name: 'Стандартный шаблон',
  fieldDefinitions: [
    { label: 'Цель', required: true, order: 0 },
    { label: 'Гипотеза', required: false, order: 1 },
    { label: 'Материалы', required: false, order: 2 },
  ] satisfies ExperimentTemplateFieldSeed[],
  defaultObservations: null as string | null,
  defaultChecklist: [] as TemplateChecklistItemSeed[],
}

export const minimalExperimentFieldSeed = [
  { label: 'Цель', required: true, order: 0 },
] satisfies ExperimentTemplateFieldSeed[]
