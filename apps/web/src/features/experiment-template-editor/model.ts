import type { ExperimentFieldDefinition } from '@labcollab/shared'
import { createEvent, createStore, sample } from 'effector'
import {
  copyUserExperimentTemplateToProjectMutation,
  createProjectExperimentTemplateMutation,
  createUserExperimentTemplateMutation,
  deleteExperimentTemplateMutation,
  projectExperimentTemplatesQuery,
  updateExperimentTemplateMutation,
  userExperimentTemplatesQuery,
} from '@/shared/api'

export type TemplateEditorScope = 'user' | 'project'

export const templatesLoadRequested = createEvent<{ scope: TemplateEditorScope, projectId?: string }>()
export const createExperimentTemplatesLoadRequested = createEvent<{ projectId: string }>()
export const templateSelected = createEvent<string | null>()
export const templateCreateRequested = createEvent()
export const templateDeleteRequested = createEvent<string>()
export const userTemplateCopyToProjectRequested = createEvent<{
  projectId: string
  sourceTemplateId: string
}>()
export const templateSaveRequested = createEvent<{
  scope: TemplateEditorScope
  projectId?: string
  id?: string
  name: string
  fieldDefinitions: ExperimentFieldDefinition[]
  defaultObservations: string | null
  defaultChecklist: Array<{ text: string, order: number }>
}>()

export const $selectedTemplateId = createStore<string | null>(null)
  .on(templateSelected, (_, id) => id)
  .reset(templateCreateRequested)

const $loadContext = createStore<{ scope: TemplateEditorScope, projectId?: string } | null>(null)
  .on(templatesLoadRequested, (_, ctx) => ctx)

sample({
  clock: templatesLoadRequested,
  filter: ({ scope }) => scope === 'user' || scope === 'project',
  target: userExperimentTemplatesQuery.start,
})

sample({
  clock: templatesLoadRequested,
  filter: ({ scope, projectId }) => scope === 'project' && Boolean(projectId),
  fn: ({ projectId }) => ({ projectId: projectId! }),
  target: projectExperimentTemplatesQuery.start,
})

sample({
  clock: createExperimentTemplatesLoadRequested,
  fn: () => ({ scope: 'user' as const }),
  target: templatesLoadRequested,
})

sample({
  clock: createExperimentTemplatesLoadRequested,
  fn: ({ projectId }) => ({ scope: 'project' as const, projectId }),
  target: templatesLoadRequested,
})

sample({
  clock: [
    createUserExperimentTemplateMutation.finished.success,
    createProjectExperimentTemplateMutation.finished.success,
    updateExperimentTemplateMutation.finished.success,
    deleteExperimentTemplateMutation.finished.success,
  ],
  source: $loadContext,
  filter: Boolean,
  target: templatesLoadRequested,
})

sample({
  clock: templateSaveRequested,
  filter: ({ id, scope }) => !id && scope === 'user',
  fn: ({ name, fieldDefinitions, defaultObservations, defaultChecklist }) => ({
    name,
    fieldDefinitions,
    defaultObservations,
    defaultChecklist,
  }),
  target: createUserExperimentTemplateMutation.start,
})

sample({
  clock: templateSaveRequested,
  filter: ({ id, scope, projectId }) => !id && scope === 'project' && Boolean(projectId),
  fn: ({ projectId, name, fieldDefinitions, defaultObservations, defaultChecklist }) => ({
    projectId: projectId!,
    name,
    fieldDefinitions,
    defaultObservations,
    defaultChecklist,
  }),
  target: createProjectExperimentTemplateMutation.start,
})

sample({
  clock: templateSaveRequested,
  filter: ({ id }) => Boolean(id),
  fn: ({ id, name, fieldDefinitions, defaultObservations, defaultChecklist }) => ({
    id: id!,
    name,
    fieldDefinitions,
    defaultObservations,
    defaultChecklist,
  }),
  target: updateExperimentTemplateMutation.start,
})

sample({
  clock: templateDeleteRequested,
  fn: id => ({ id }),
  target: deleteExperimentTemplateMutation.start,
})

sample({
  clock: userTemplateCopyToProjectRequested,
  target: copyUserExperimentTemplateToProjectMutation.start,
})

sample({
  clock: copyUserExperimentTemplateToProjectMutation.finished.success,
  source: $loadContext,
  filter: Boolean,
  target: templatesLoadRequested,
})

sample({
  clock: copyUserExperimentTemplateToProjectMutation.finished.success,
  fn: ({ result }) => result.id,
  target: templateSelected,
})

sample({
  clock: deleteExperimentTemplateMutation.finished.success,
  fn: () => null,
  target: templateSelected,
})

sample({
  clock: createUserExperimentTemplateMutation.finished.success,
  fn: ({ result }) => result.id,
  target: templateSelected,
})

sample({
  clock: createProjectExperimentTemplateMutation.finished.success,
  fn: ({ result }) => result.id,
  target: templateSelected,
})
