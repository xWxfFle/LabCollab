import type {
  ExperimentChecklistItem,
  ExperimentDto,
  ExperimentStatus,
  ExperimentVersionDto,
} from '@labcollab/shared'
import type { AttachmentDraftRow } from '@/features/experiment-attachments'
import { createForm } from '@effector-reform/core'
import { combine, createEffect, createEvent, createStore, restore, sample } from 'effector'
import { reset } from 'patronum'
import { workspaceRefreshRequested } from '@/features/project-sidebar'
import {
  attachmentsQuery,
  downloadAttachmentFx,
  downloadPdfFx,
  experimentQuery,
  patchExperimentMutation,
  projectQuery,
  syncExperimentAttachmentsFx,
  versionsQuery,
} from '@/shared/api'
import { checklistItemsEqual, recordsEqual, stringArraysEqual } from '@/shared/lib/shallow-equal'
import { debouncedRouteOpened, routes } from '@/shared/routing'
import { chainAuthenticated } from '@/shared/viewer'

export const currentRoute = routes.experimentView
export const authenticatedRoute = chainAuthenticated(currentRoute)
export const routeOpened = debouncedRouteOpened(currentRoute)

const $routeOpen = createStore(false)
  .on(currentRoute.opened, () => true)
  .reset(currentRoute.closed)

export const observationsTextChanged = createEvent<string>()
export const fieldValueChanged = createEvent<{ fieldId: string, value: string }>()
export const checklistChanged = createEvent<ExperimentChecklistItem[]>()
export const saveRequested = createEvent<{
  title: string
  status: ExperimentStatus
}>()
export const exportPdfClicked = createEvent()
export const pendingAttachmentsAdded = createEvent<File[]>()
export const pendingAttachmentRemoved = createEvent<{ id: string, source: 'local' | 'server' }>()
export const versionSelected = createEvent<ExperimentVersionDto>()
export const versionModalClosed = createEvent()
export const attachmentDownloadClicked = createEvent<{ id: string, filename: string }>()
export const tagsChanged = createEvent<string[]>()

export const $observationsText = restore(observationsTextChanged, '')
export const $fieldValues = createStore<Record<string, string>>({})
export const $fieldDefinitions = createStore<ExperimentDto['fieldDefinitions']>([])
export const $checklist = restore(checklistChanged, [] as ExperimentChecklistItem[])
export const $tags = restore(tagsChanged, [])

export const $pendingAttachmentUploads = createStore<Array<{ localId: string, file: File }>>([])
  .on(pendingAttachmentsAdded, (items, files) => [
    ...items,
    ...files.map(file => ({ localId: crypto.randomUUID(), file })),
  ])
  .on(pendingAttachmentRemoved, (items, { id, source }) =>
    source === 'local' ? items.filter(item => item.localId !== id) : items)

export const $pendingAttachmentDeletes = createStore<string[]>([])
  .on(pendingAttachmentRemoved, (ids, { id, source }) =>
    source === 'server' && !ids.includes(id) ? [...ids, id] : ids)

export const $attachmentDraftRows = combine(
  attachmentsQuery.$data,
  $pendingAttachmentUploads,
  $pendingAttachmentDeletes,
  (serverAttachments, pendingUploads, pendingDeletes) => {
    const deleteSet = new Set(pendingDeletes)
    const rows: AttachmentDraftRow[] = []

    for (const attachment of serverAttachments ?? []) {
      if (deleteSet.has(attachment.id))
        continue
      rows.push({
        id: attachment.id,
        filename: attachment.filename,
        source: 'server',
        isPending: false,
      })
    }

    for (const pending of pendingUploads) {
      rows.push({
        id: pending.localId,
        filename: pending.file.name,
        source: 'local',
        isPending: true,
      })
    }

    return rows
  },
)

export const $canEdit = createStore(false)

export const $versionModalOpened = createStore(false)
  .on(versionSelected, () => true)
  .reset(versionModalClosed)

export const $selectedVersion = restore(versionSelected, null as ExperimentVersionDto | null)
  .reset(versionModalClosed)

export const $isSaving = combine(
  patchExperimentMutation.$pending,
  syncExperimentAttachmentsFx.pending,
  (patchPending, attachmentsPending) => patchPending || attachmentsPending,
)

export const metadataForm = createForm({
  schema: {
    title: '',
    status: 'draft' as ExperimentStatus,
  },
})

interface ExperimentBaseline {
  title: string
  status: ExperimentStatus
  fieldValues: Record<string, string>
  checklist: ExperimentChecklistItem[]
  observationsText: string
  tags: string[]
}

export const $savedBaseline = createStore<ExperimentBaseline | null>(null)

const $formDraft = createStore<{ title: string, status: ExperimentStatus }>({
  title: '',
  status: 'draft',
})
  .on(metadataForm.changed, (_, values) => values)

export const $isDirty = combine(
  {
    baseline: $savedBaseline,
    formDraft: $formDraft,
    fieldValues: $fieldValues,
    checklist: $checklist,
    observationsText: $observationsText,
    tags: $tags,
    pendingUploads: $pendingAttachmentUploads,
    pendingDeletes: $pendingAttachmentDeletes,
  },
  ({
    baseline,
    formDraft,
    fieldValues,
    checklist,
    observationsText,
    tags,
    pendingUploads,
    pendingDeletes,
  }) => {
    if (!baseline)
      return false
    return (
      baseline.title !== formDraft.title
      || baseline.status !== formDraft.status
      || baseline.observationsText !== observationsText
      || !recordsEqual(baseline.fieldValues, fieldValues)
      || !checklistItemsEqual(baseline.checklist, checklist)
      || !stringArraysEqual(baseline.tags, tags)
      || pendingUploads.length > 0
      || pendingDeletes.length > 0
    )
  },
)

function baselineFromExperiment(result: ExperimentDto): ExperimentBaseline {
  return {
    title: result.title,
    status: result.status,
    fieldValues: { ...result.fieldValues },
    checklist: result.checklist.map(item => ({ ...item })),
    observationsText: result.observationsText ?? '',
    tags: [...(result.tags ?? [])],
  }
}

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
    title: result.title,
    status: result.status,
  }),
  target: $formDraft,
})

sample({
  clock: experimentQuery.finished.success,
  fn: ({ result }: { result: ExperimentDto }) => ({
    values: {
      title: result.title,
      status: result.status,
    },
  }),
  target: metadataForm.fill,
})

sample({
  clock: experimentQuery.finished.success,
  fn: ({ result }: { result: ExperimentDto }) => result.fieldDefinitions,
  target: $fieldDefinitions,
})

sample({
  clock: experimentQuery.finished.success,
  fn: ({ result }: { result: ExperimentDto }) => ({ ...result.fieldValues }),
  target: $fieldValues,
})

sample({
  clock: experimentQuery.finished.success,
  fn: ({ result }: { result: ExperimentDto }) => result.checklist.map(item => ({ ...item })),
  target: $checklist,
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
  clock: experimentQuery.finished.success,
  fn: ({ result }: { result: ExperimentDto }) => baselineFromExperiment(result),
  target: $savedBaseline,
})

sample({
  clock: experimentQuery.finished.success,
  fn: () => [],
  target: [$pendingAttachmentUploads, $pendingAttachmentDeletes],
})

sample({
  clock: fieldValueChanged,
  source: $fieldValues,
  fn: (values, { fieldId, value }) => ({ ...values, [fieldId]: value }),
  target: $fieldValues,
})

sample({
  clock: saveRequested,
  source: {
    params: currentRoute.$params,
    opened: $routeOpen,
    canEdit: $canEdit,
    fieldValues: $fieldValues,
    checklist: $checklist,
    observationsText: $observationsText,
    tags: $tags,
  },
  filter: ({ opened, params, canEdit }) =>
    canEdit && opened && Boolean(params.experimentId),
  fn: ({ params, fieldValues, checklist, observationsText, tags }, { title, status }) => ({
    id: params.experimentId,
    title,
    status,
    fieldValues,
    checklist,
    observationsText,
    tags,
  }),
  target: patchExperimentMutation.start,
})

sample({
  clock: patchExperimentMutation.finished.success,
  fn: ({ result }) => baselineFromExperiment(result),
  target: $savedBaseline,
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
  clock: patchExperimentMutation.finished.success,
  source: {
    params: currentRoute.$params,
    uploads: $pendingAttachmentUploads,
    deletes: $pendingAttachmentDeletes,
  },
  filter: ({ params, uploads, deletes }) =>
    Boolean(params.experimentId) && (uploads.length > 0 || deletes.length > 0),
  fn: ({ params, uploads, deletes }) => ({
    experimentId: params.experimentId,
    uploads,
    deletes,
  }),
  target: syncExperimentAttachmentsFx,
})

sample({
  clock: syncExperimentAttachmentsFx.done,
  fn: () => [],
  target: [$pendingAttachmentUploads, $pendingAttachmentDeletes],
})

sample({
  clock: syncExperimentAttachmentsFx.done,
  source: currentRoute.$params,
  fn: params => ({ experimentId: params.experimentId }),
  target: attachmentsQuery.start,
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
  clock: attachmentDownloadClicked,
  fn: ({ id, filename }) => ({ attachmentId: id, filename }),
  target: downloadAttachmentFx,
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
  clock: currentRoute.closed,
  target: metadataForm.reset,
})

reset({
  clock: currentRoute.closed,
  target: [
    $observationsText,
    $fieldValues,
    $fieldDefinitions,
    $checklist,
    $tags,
    $pendingAttachmentUploads,
    $pendingAttachmentDeletes,
    $versionModalOpened,
    $selectedVersion,
    $routeOpen,
    $savedBaseline,
    $formDraft,
  ],
})

export {
  attachmentsQuery,
  experimentQuery,
  versionsQuery,
}
