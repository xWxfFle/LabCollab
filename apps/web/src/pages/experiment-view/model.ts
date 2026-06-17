import type { ExperimentDto, ExperimentVersionDto } from '@labcollab/shared'
import { createForm } from '@effector-reform/core'
import { createEffect, createEvent, createStore, restore, sample } from 'effector'
import { debounce, reset } from 'patronum'
import { workspaceRefreshRequested } from '@/features/project-sidebar'
import {
  attachmentsQuery,
  downloadAttachmentFx,
  downloadPdfFx,
  experimentQuery,
  patchExperimentMutation,
  projectQuery,
  uploadAttachmentFx,
  versionsQuery,
} from '@/shared/api'
import { debouncedRouteOpened, routes } from '@/shared/routing'
import { chainAuthenticated } from '@/shared/viewer'

export const currentRoute = routes.experimentView
export const authenticatedRoute = chainAuthenticated(currentRoute)
export const routeOpened = debouncedRouteOpened(currentRoute)

const $routeOpen = createStore(false)
  .on(currentRoute.opened, () => true)
  .reset(currentRoute.closed)

export const observationsTextChanged = createEvent<string>()
export const exportPdfClicked = createEvent()
export const fileSelected = createEvent<File>()
export const versionSelected = createEvent<ExperimentVersionDto>()
export const versionModalClosed = createEvent()
export const attachmentDownloadClicked = createEvent<{ id: string, filename: string }>()
export const tagsChanged = createEvent<string[]>()

export const $observationsText = restore(observationsTextChanged, '')
export const $tags = restore(tagsChanged, [])

export const $canEdit = createStore(false)

export const $versionModalOpened = createStore(false)
  .on(versionSelected, () => true)
  .reset(versionModalClosed)

export const $selectedVersion = restore(versionSelected, null as ExperimentVersionDto | null)
  .reset(versionModalClosed)

export const $isSaving = patchExperimentMutation.$pending

export const metadataForm = createForm({
  schema: {
    title: '',
    status: 'draft' as 'draft' | 'in_progress' | 'completed',
    objective: '',
    hypothesis: '',
    materials: '',
    protocolSteps: '',
    conditions: '',
    results: '',
  },
})

const metadataChanged = debounce({
  source: metadataForm.changed,
  timeout: 2000,
})

const observationsChanged = debounce({
  source: observationsTextChanged,
  timeout: 2000,
})

const tagsDebounced = debounce({
  source: tagsChanged,
  timeout: 2000,
})

sample({
  clock: routeOpened,
  fn: ({ params }) => ({ id: params.experimentId }),
  target: experimentQuery.start,
})

sample({
  clock: routeOpened,
  fn: ({ params }) => ({ id: params.projectId }),
  target: projectQuery.start,
})

sample({
  clock: routeOpened,
  fn: ({ params }) => ({ experimentId: params.experimentId }),
  target: [versionsQuery.start, attachmentsQuery.start],
})

sample({
  clock: projectQuery.finished.success,
  fn: ({ result }) => result.role !== 'viewer',
  target: $canEdit,
})

sample({
  clock: currentRoute.closed,
  fn: () => false,
  target: $canEdit,
})

sample({
  clock: experimentQuery.finished.success,
  fn: ({ result }: { result: ExperimentDto }) => ({
    values: {
      title: result.title,
      status: result.status,
      objective: result.objective,
      hypothesis: result.hypothesis ?? '',
      materials: result.materials ?? '',
      protocolSteps: result.protocolSteps ?? '',
      conditions: result.conditions ?? '',
      results: result.results ?? '',
    },
  }),
  target: metadataForm.fill,
})

sample({
  clock: experimentQuery.finished.success,
  fn: ({ result }: { result: ExperimentDto }) => result.observationsText ?? '',
  target: $observationsText,
})

sample({
  clock: experimentQuery.finished.success,
  fn: ({ result }: { result: ExperimentDto }) => result.tags ?? [],
  target: $tags,
})

sample({
  clock: tagsDebounced,
  source: {
    params: currentRoute.$params,
    opened: $routeOpen,
    canEdit: $canEdit,
  },
  filter: ({ opened, params, canEdit }) =>
    canEdit && opened && Boolean(params.experimentId),
  fn: ({ params }, tags) => ({
    id: params.experimentId,
    tags,
  }),
  target: patchExperimentMutation.start,
})

sample({
  clock: observationsChanged,
  source: {
    params: currentRoute.$params,
    opened: $routeOpen,
    canEdit: $canEdit,
  },
  filter: ({ opened, params, canEdit }) =>
    canEdit && opened && Boolean(params.experimentId),
  fn: ({ params }, observations) => ({
    id: params.experimentId,
    observationsText: observations,
  }),
  target: patchExperimentMutation.start,
})

sample({
  clock: metadataChanged,
  source: {
    params: currentRoute.$params,
    observations: $observationsText,
    opened: $routeOpen,
    canEdit: $canEdit,
  },
  filter: ({ opened, params, canEdit }) =>
    canEdit && opened && Boolean(params.experimentId),
  fn: ({ params, observations }, values) => ({
    id: params.experimentId,
    ...values,
    observationsText: observations,
  }),
  target: patchExperimentMutation.start,
})

sample({
  clock: patchExperimentMutation.finished.success,
  source: currentRoute.$params,
  fn: params => ({ experimentId: params.experimentId }),
  target: versionsQuery.start,
})

sample({
  clock: patchExperimentMutation.finished.success,
  target: workspaceRefreshRequested,
})

sample({
  clock: exportPdfClicked,
  source: { params: currentRoute.$params, observations: $observationsText },
  fn: ({ params, observations }) => ({
    experimentId: params.experimentId,
    observationsText: observations,
  }),
  target: downloadPdfFx,
})

sample({
  clock: fileSelected,
  source: { params: currentRoute.$params, canEdit: $canEdit },
  filter: ({ canEdit }) => canEdit,
  fn: ({ params }, file) => ({ experimentId: params.experimentId, file }),
  target: uploadAttachmentFx,
})

sample({
  clock: uploadAttachmentFx.done,
  source: currentRoute.$params,
  fn: params => ({ experimentId: params.experimentId }),
  target: attachmentsQuery.start,
})

const savePdfFx = createEffect(
  ({ blob, experimentId }: { blob: Blob, experimentId: string }) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `experiment-${experimentId}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  },
)

sample({
  clock: downloadPdfFx.done,
  fn: ({ params, result }) => ({
    blob: result,
    experimentId: params.experimentId,
  }),
  target: savePdfFx,
})

sample({
  clock: attachmentDownloadClicked,
  fn: ({ id, filename }) => ({ attachmentId: id, filename }),
  target: downloadAttachmentFx,
})

sample({
  clock: currentRoute.closed,
  target: metadataForm.reset,
})

reset({
  clock: currentRoute.closed,
  target: [$observationsText, $tags, $versionModalOpened, $selectedVersion, $routeOpen],
})

export {
  attachmentsQuery,
  experimentQuery,
  versionsQuery,
}
