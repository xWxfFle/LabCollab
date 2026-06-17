import type { ExperimentStatus, ProjectNodeType } from '@labcollab/shared'
import { createForm } from '@effector-reform/core'
import { zodAdapter } from '@effector-reform/zod'
import { createExperimentSchema } from '@labcollab/shared'
import { combine, createEvent, createStore, merge, restore, sample } from 'effector'
import { debounce, previous, reset } from 'patronum'
import { createExperimentTemplatesLoadRequested } from '@/features/experiment-template-editor/model'
import {
  copyUserExperimentTemplateToProjectMutation,
  createExperimentMutation,
  createFolderMutation,
  createPageMutation,
  deleteExperimentMutation,
  deleteWorkspaceNodeMutation,
  moveWorkspaceNodeMutation,
  patchWorkspaceNodeMutation,
  projectExperimentTemplatesQuery,
  projectPageQuery,
  projectQuery,
  workspaceQuery,
  workspaceSearchQuery,
} from '@/shared/api'
import { controls, router, routes } from '@/shared/routing'
import {
  parseWorkspaceFiltersFromQuery,
  workspaceFiltersToQuery,
} from './workspace-filters-query'

export const newFolderClicked = createEvent<string | null>()
export const newPageClicked = createEvent<string | null>()
export const newExperimentClicked = createEvent<string | null>()
export const createExperimentModalClosed = createEvent()
export const createTemplateIdChanged = createEvent<string | null>()
export const statusFilterChanged = createEvent<ExperimentStatus | 'all'>()
export const tagFilterChanged = createEvent<string | null>()
export const searchQueryChanged = createEvent<string>()
export const workspaceFiltersApplied = createEvent<{
  status: ExperimentStatus | 'all'
  tag: string | null
  search: string
}>()
export const workspaceRefreshRequested = createEvent()

export const nodeDeleteClicked = createEvent<{
  nodeId: string
  type: ProjectNodeType
  experimentId?: string | null
  pageId?: string | null
}>()

export const nodeMoveClicked = createEvent<{ nodeId: string, type: ProjectNodeType }>()
export const nodeMoveModalClosed = createEvent()
export const nodeMoveConfirmed = createEvent<string | null>()

export const nodeRenameClicked = createEvent<{
  nodeId: string
  type: ProjectNodeType
  title: string
  pageId?: string | null
}>()
export const nodeRenameModalClosed = createEvent()
export const nodeRenameConfirmed = createEvent<string>()

export const $lastDeleteTarget = createStore<{
  pageId?: string
  experimentId?: string
} | null>(null)
  .on(nodeDeleteClicked, (_, payload) => ({
    pageId: payload.pageId ?? undefined,
    experimentId: payload.experimentId ?? undefined,
  }))
  .reset([
    deleteWorkspaceNodeMutation.finished.success,
    deleteExperimentMutation.finished.success,
  ])

export const projectRouteClosed = merge([
  routes.projectView.closed,
  routes.projectPageView.closed,
  routes.experimentView.closed,
  routes.projectSettings.closed,
])

const $anyProjectRouteOpened = combine(
  routes.projectView.$isOpened,
  routes.projectPageView.$isOpened,
  routes.experimentView.$isOpened,
  routes.projectSettings.$isOpened,
  (...opened) => opened.some(Boolean),
)

const $projectIdFromRoute = combine(
  routes.projectView.$isOpened,
  routes.projectView.$params,
  routes.projectPageView.$isOpened,
  routes.projectPageView.$params,
  routes.experimentView.$isOpened,
  routes.experimentView.$params,
  routes.projectSettings.$isOpened,
  routes.projectSettings.$params,
  (
    projectViewOpened,
    projectViewParams,
    projectPageOpened,
    projectPageParams,
    experimentOpened,
    experimentParams,
    settingsOpened,
    settingsParams,
  ) => {
    if (projectViewOpened)
      return projectViewParams.id ?? null
    if (projectPageOpened)
      return projectPageParams.projectId ?? null
    if (experimentOpened)
      return experimentParams.projectId ?? null
    if (settingsOpened)
      return settingsParams.projectId ?? null
    return null
  },
)

/** id проекта из активного маршрута; при смене экрана внутри проекта держим предыдущий id. */
export const $projectId = combine(
  $projectIdFromRoute,
  previous($projectIdFromRoute),
  $anyProjectRouteOpened,
  router.$path,
  (current, prev, anyProjectRouteOpened, path) => {
    if (current)
      return current
    const inProjectPath = path?.includes('/projects/') ?? false
    if (prev && (anyProjectRouteOpened || inProjectPath))
      return prev
    return null
  },
)

export const $createParentNodeId = createStore<string | null>(null)
  .on(newFolderClicked, (_, parentId) => parentId)
  .on(newPageClicked, (_, parentId) => parentId)
  .on(newExperimentClicked, (_, parentId) => parentId)
  .reset(createExperimentModalClosed)

export const $createExperimentModalOpened = createStore(false)
  .on(newExperimentClicked, () => true)
  .reset(createExperimentModalClosed)

export const $moveModalOpened = createStore(false)
  .on(nodeMoveClicked, () => true)
  .reset(nodeMoveModalClosed)

export const $moveTarget = createStore<{ nodeId: string, type: ProjectNodeType } | null>(null)
  .on(nodeMoveClicked, (_, payload) => payload)
  .reset(nodeMoveModalClosed)

export const $renameModalOpened = createStore(false)
  .on(nodeRenameClicked, () => true)
  .reset(nodeRenameModalClosed)

export const $renameTarget = createStore<{
  nodeId: string
  type: ProjectNodeType
  title: string
  pageId?: string | null
} | null>(null)
  .on(nodeRenameClicked, (_, payload) => payload)
  .reset(nodeRenameModalClosed)

export const $createTemplateId = restore(createTemplateIdChanged, null as string | null)
  .reset(createExperimentModalClosed)

export const $statusFilter = restore(statusFilterChanged, 'all' as ExperimentStatus | 'all')
  .on(workspaceFiltersApplied, (_, filters) => filters.status)

export const $tagFilter = restore(tagFilterChanged, null as string | null)
  .on(workspaceFiltersApplied, (_, filters) => filters.tag)

export const $searchQuery = restore(searchQueryChanged, '')
  .on(workspaceFiltersApplied, (_, filters) => filters.search)

export const $workspaceFiltersQuery = combine(
  $statusFilter,
  $tagFilter,
  $searchQuery,
  (status, tag, search) => workspaceFiltersToQuery({ status, tag, search }),
)

export const $canEdit = projectQuery.$data.map(p => p != null && p.role !== 'viewer')
export const $canManage = projectQuery.$data.map(p => p?.role === 'owner')

const debouncedSearch = debounce({
  source: searchQueryChanged,
  timeout: 400,
})

const projectRouteOpened = merge([
  routes.projectView.opened,
  routes.projectPageView.opened,
  routes.experimentView.opened,
  routes.projectSettings.opened,
])

sample({
  clock: projectRouteOpened,
  fn: payload => parseWorkspaceFiltersFromQuery(payload.query),
  target: workspaceFiltersApplied,
})

sample({
  clock: controls.locationUpdated,
  filter: ({ pathname }) => pathname.includes('/projects/'),
  fn: ({ query }) => parseWorkspaceFiltersFromQuery(query),
  target: workspaceFiltersApplied,
})

sample({
  clock: statusFilterChanged,
  source: combine({
    tag: $tagFilter,
    search: $searchQuery,
    path: router.$path,
  }),
  filter: ({ path }) => path.includes('/projects/'),
  fn: ({ tag, search, path }, status) => ({
    path,
    query: workspaceFiltersToQuery({ status, tag, search }),
    replace: true,
  }),
  target: router.navigate,
})

sample({
  clock: tagFilterChanged,
  source: combine({
    status: $statusFilter,
    search: $searchQuery,
    path: router.$path,
  }),
  filter: ({ path }) => path.includes('/projects/'),
  fn: ({ status, search, path }, tag) => ({
    path,
    query: workspaceFiltersToQuery({ status, tag, search }),
    replace: true,
  }),
  target: router.navigate,
})

sample({
  clock: debouncedSearch,
  source: combine({
    status: $statusFilter,
    tag: $tagFilter,
    path: router.$path,
  }),
  filter: ({ path }) => path.includes('/projects/'),
  fn: ({ status, tag, path }, search) => ({
    path,
    query: workspaceFiltersToQuery({ status, tag, search }),
    replace: true,
  }),
  target: router.navigate,
})

sample({
  clock: workspaceFiltersApplied,
  source: $projectId,
  filter: (projectId, filters) => Boolean(projectId && filters.search.trim()),
  fn: (projectId, filters) => ({ projectId: projectId!, q: filters.search.trim() }),
  target: workspaceSearchQuery.start,
})

export const createExperimentForm = createForm({
  schema: {
    title: '',
  },
  validation: zodAdapter(createExperimentSchema.pick({ title: true })),
})

sample({
  clock: newExperimentClicked,
  source: $projectId,
  filter: Boolean,
  fn: projectId => ({ projectId: projectId! }),
  target: createExperimentTemplatesLoadRequested,
})

sample({
  clock: projectExperimentTemplatesQuery.finished.success,
  source: $createExperimentModalOpened,
  filter: opened => opened,
  fn: (_, { result }) => result[0]?.id ?? null,
  target: createTemplateIdChanged,
})

sample({
  clock: [
    routes.projectView.opened,
    routes.projectPageView.opened,
    routes.experimentView.opened,
    routes.projectSettings.opened,
  ],
  fn: ({ params }) =>
    'id' in params && params.id
      ? { id: params.id as string }
      : { id: (params as { projectId: string }).projectId },
  target: projectQuery.start,
})

sample({
  clock: [
    routes.projectView.opened,
    routes.projectPageView.opened,
    routes.experimentView.opened,
    routes.projectSettings.opened,
    workspaceRefreshRequested,
    createFolderMutation.finished.success,
    createPageMutation.finished.success,
    createExperimentMutation.finished.success,
    deleteWorkspaceNodeMutation.finished.success,
    deleteExperimentMutation.finished.success,
    moveWorkspaceNodeMutation.finished.success,
    patchWorkspaceNodeMutation.finished.success,
  ],
  source: $projectId,
  filter: Boolean,
  fn: projectId => ({ projectId: projectId! }),
  target: workspaceQuery.start,
})

sample({
  clock: debouncedSearch,
  source: { projectId: $projectId, q: $searchQuery },
  filter: ({ projectId, q }) => Boolean(projectId && q.trim().length > 0),
  fn: ({ projectId, q }) => ({ projectId: projectId!, q: q.trim() }),
  target: workspaceSearchQuery.start,
})

sample({
  clock: newFolderClicked,
  source: $projectId,
  filter: Boolean,
  fn: (projectId, parentId) => ({
    projectId: projectId!,
    title: 'Новая папка',
    parentId,
  }),
  target: createFolderMutation.start,
})

sample({
  clock: newPageClicked,
  source: $projectId,
  filter: Boolean,
  fn: (projectId, parentId) => ({
    projectId: projectId!,
    title: 'Новая страница',
    parentId,
  }),
  target: createPageMutation.start,
})

sample({
  clock: createPageMutation.finished.success,
  source: $workspaceFiltersQuery,
  fn: (query, { result, params }) => ({
    params: {
      projectId: params.projectId,
      pageId: result.id,
    },
    query,
  }),
  target: routes.projectPageView.open,
})

sample({
  clock: createExperimentForm.validatedAndSubmitted,
  source: {
    projectId: $projectId,
    parentNodeId: $createParentNodeId,
    templateId: $createTemplateId,
  },
  filter: ({ projectId }) => Boolean(projectId),
  fn: ({ projectId, parentNodeId, templateId }, values) => ({
    projectId: projectId!,
    title: values.title,
    status: 'draft' as const,
    ...(templateId ? { templateId } : {}),
    ...(parentNodeId ? { parentNodeId } : {}),
  }),
  target: createExperimentMutation.start,
})

sample({
  clock: createExperimentMutation.finished.success,
  target: createExperimentModalClosed,
})

sample({
  clock: createExperimentMutation.finished.success,
  source: combine({ projectId: $projectId, query: $workspaceFiltersQuery }),
  filter: ({ projectId }) => Boolean(projectId),
  fn: ({ projectId, query }, { result }) => ({
    params: {
      projectId: projectId!,
      experimentId: result.id,
    },
    query,
  }),
  target: routes.experimentView.open,
})

sample({
  clock: copyUserExperimentTemplateToProjectMutation.finished.success,
  fn: ({ result }) => result.id,
  target: createTemplateIdChanged,
})

sample({
  clock: nodeDeleteClicked,
  filter: ({ type, experimentId }) => type === 'experiment' && Boolean(experimentId),
  fn: ({ experimentId }) => ({ id: experimentId! }),
  target: deleteExperimentMutation.start,
})

sample({
  clock: nodeDeleteClicked,
  filter: ({ type }) => type === 'folder' || type === 'page',
  fn: ({ nodeId }) => ({ id: nodeId }),
  target: deleteWorkspaceNodeMutation.start,
})

sample({
  clock: nodeMoveConfirmed,
  source: $moveTarget,
  filter: Boolean,
  fn: (target, parentId) => ({
    id: target!.nodeId,
    parentId,
    sortOrder: 0,
  }),
  target: moveWorkspaceNodeMutation.start,
})

sample({
  clock: moveWorkspaceNodeMutation.finished.success,
  target: nodeMoveModalClosed,
})

sample({
  clock: nodeRenameConfirmed,
  source: $renameTarget,
  filter: Boolean,
  fn: (target, title) => ({
    id: target!.nodeId,
    title,
  }),
  target: patchWorkspaceNodeMutation.start,
})

sample({
  clock: patchWorkspaceNodeMutation.finished.success,
  source: {
    pageParams: routes.projectPageView.$params,
    target: $renameTarget,
  },
  filter: ({ pageParams, target }) =>
    Boolean(target?.type === 'page' && target.pageId && target.pageId === pageParams.pageId),
  fn: ({ pageParams }) => ({ id: pageParams.pageId }),
  target: projectPageQuery.start,
})

sample({
  clock: patchWorkspaceNodeMutation.finished.success,
  target: nodeRenameModalClosed,
})

sample({
  clock: deleteWorkspaceNodeMutation.finished.success,
  source: {
    pageParams: routes.projectPageView.$params,
    target: $lastDeleteTarget,
    projectId: $projectId,
    query: $workspaceFiltersQuery,
  },
  filter: ({ pageParams, target }) =>
    Boolean(target?.pageId && target.pageId === pageParams.pageId),
  fn: ({ projectId, query }) => ({
    params: { id: projectId! },
    query,
  }),
  target: routes.projectView.open,
})

sample({
  clock: deleteExperimentMutation.finished.success,
  source: {
    experimentParams: routes.experimentView.$params,
    target: $lastDeleteTarget,
    projectId: $projectId,
    query: $workspaceFiltersQuery,
  },
  filter: ({ experimentParams, target }) =>
    Boolean(target?.experimentId && target.experimentId === experimentParams.experimentId),
  fn: ({ projectId, query }) => ({
    params: { id: projectId! },
    query,
  }),
  target: routes.projectView.open,
})

reset({
  clock: projectRouteClosed,
  target: [
    $createExperimentModalOpened,
    $createParentNodeId,
    $createTemplateId,
    $moveModalOpened,
    $moveTarget,
    $renameModalOpened,
    $renameTarget,
    $lastDeleteTarget,
  ],
})

sample({
  clock: projectRouteClosed,
  target: createExperimentForm.reset,
})

sample({
  clock: createExperimentModalClosed,
  target: createExperimentForm.reset,
})
