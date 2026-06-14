import type { ExperimentStatus, ProjectNodeType } from '@labcollab/shared';
import { createForm } from '@effector-reform/core';
import { zodAdapter } from '@effector-reform/zod';
import { createEvent, createStore, merge, sample } from 'effector';
import { debounce, reset } from 'patronum';
import { addMemberSchema, createExperimentSchema } from '@labcollab/shared';
import {
  addMemberMutation,
  createExperimentMutation,
  createFolderMutation,
  createPageMutation,
  deleteExperimentMutation,
  deleteWorkspaceNodeMutation,
  moveWorkspaceNodeMutation,
  projectQuery,
  workspaceQuery,
  workspaceSearchQuery,
} from '@/shared/api';
import { routes } from '@/shared/routing';

export const memberModalOpened = createEvent();
export const memberModalClosed = createEvent();
export const newFolderClicked = createEvent<string | null>();
export const newPageClicked = createEvent<string | null>();
export const newExperimentClicked = createEvent<string | null>();
export const createExperimentModalClosed = createEvent();
export const statusFilterChanged = createEvent<ExperimentStatus | 'all'>();
export const searchQueryChanged = createEvent<string>();
export const workspaceRefreshRequested = createEvent();

export const nodeDeleteClicked = createEvent<{
  nodeId: string;
  type: ProjectNodeType;
  experimentId?: string | null;
  pageId?: string | null;
}>();

export const nodeMoveClicked = createEvent<{ nodeId: string; type: ProjectNodeType }>();
export const nodeMoveModalClosed = createEvent();
export const nodeMoveConfirmed = createEvent<string | null>();

export const $lastDeleteTarget = createStore<{
  pageId?: string;
  experimentId?: string;
} | null>(null)
  .on(nodeDeleteClicked, (_, payload) => ({
    pageId: payload.pageId ?? undefined,
    experimentId: payload.experimentId ?? undefined,
  }))
  .reset([
    deleteWorkspaceNodeMutation.finished.success,
    deleteExperimentMutation.finished.success,
  ]);

const projectRouteClosed = merge([
  routes.projectView.closed,
  routes.projectPageView.closed,
  routes.experimentView.closed,
]);

export const $projectId = createStore<string | null>(null)
  .on(routes.projectView.opened, (_, { params }) => params.id)
  .on(routes.projectPageView.opened, (_, { params }) => params.projectId)
  .on(routes.experimentView.opened, (_, { params }) => params.projectId)
  .reset(projectRouteClosed);

export const $memberModalOpened = createStore(false)
  .on(memberModalOpened, () => true)
  .on(memberModalClosed, () => false);

export const $createParentNodeId = createStore<string | null>(null)
  .on(newFolderClicked, (_, parentId) => parentId)
  .on(newPageClicked, (_, parentId) => parentId)
  .on(newExperimentClicked, (_, parentId) => parentId)
  .reset(createExperimentModalClosed);

export const $createExperimentModalOpened = createStore(false)
  .on(newExperimentClicked, () => true)
  .on(createExperimentModalClosed, () => false);

export const $moveModalOpened = createStore(false)
  .on(nodeMoveClicked, () => true)
  .on(nodeMoveModalClosed, () => false);

export const $moveTarget = createStore<{ nodeId: string; type: ProjectNodeType } | null>(null)
  .on(nodeMoveClicked, (_, payload) => payload)
  .reset(nodeMoveModalClosed);

export const $statusFilter = createStore<ExperimentStatus | 'all'>('all').on(
  statusFilterChanged,
  (_, status) => status,
);

export const $searchQuery = createStore('').on(searchQueryChanged, (_, q) => q);

export const $canEdit = projectQuery.$data.map((p) => p != null && p.role !== 'viewer');
export const $canManage = projectQuery.$data.map((p) => p?.role === 'owner');

const debouncedSearch = debounce({
  source: searchQueryChanged,
  timeout: 400,
});

export const memberForm = createForm({
  schema: {
    email: 'bob@lab.local',
    role: 'editor' as 'editor' | 'viewer',
  },
  validation: zodAdapter(addMemberSchema),
});

export const createExperimentForm = createForm({
  schema: {
    title: '',
    objective: '',
  },
  validation: zodAdapter(createExperimentSchema.pick({ title: true, objective: true })),
});

sample({
  clock: [
    routes.projectView.opened,
    routes.projectPageView.opened,
    routes.experimentView.opened,
  ],
  fn: ({ params }) =>
    'id' in params && params.id
      ? { id: params.id as string }
      : { id: (params as { projectId: string }).projectId },
  target: projectQuery.start,
});

sample({
  clock: [
    routes.projectView.opened,
    routes.projectPageView.opened,
    routes.experimentView.opened,
    workspaceRefreshRequested,
    createFolderMutation.finished.success,
    createPageMutation.finished.success,
    createExperimentMutation.finished.success,
    deleteWorkspaceNodeMutation.finished.success,
    deleteExperimentMutation.finished.success,
    moveWorkspaceNodeMutation.finished.success,
  ],
  source: $projectId,
  filter: Boolean,
  fn: (projectId) => ({ projectId: projectId! }),
  target: workspaceQuery.start,
});

sample({
  clock: debouncedSearch,
  source: { projectId: $projectId, q: $searchQuery },
  filter: ({ projectId, q }) => Boolean(projectId && q.trim().length > 0),
  fn: ({ projectId, q }) => ({ projectId: projectId!, q: q.trim() }),
  target: workspaceSearchQuery.start,
});

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
});

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
});

sample({
  clock: createPageMutation.finished.success,
  fn: ({ result, params }) => ({
    params: {
      projectId: params.projectId,
      pageId: result.id,
    },
    query: {},
  }),
  target: routes.projectPageView.open,
});

sample({
  clock: createExperimentForm.validatedAndSubmitted,
  source: { projectId: $projectId, parentNodeId: $createParentNodeId },
  filter: ({ projectId }) => Boolean(projectId),
  fn: ({ projectId, parentNodeId }, values) => ({
    projectId: projectId!,
    title: values.title,
    objective: values.objective,
    status: 'draft' as const,
    ...(parentNodeId ? { parentNodeId } : {}),
  }),
  target: createExperimentMutation.start,
});

sample({
  clock: createExperimentMutation.finished.success,
  target: createExperimentModalClosed,
});

sample({
  clock: createExperimentMutation.finished.success,
  source: $projectId,
  filter: Boolean,
  fn: (projectId, { result }) => ({
    params: {
      projectId: projectId!,
      experimentId: result.id,
    },
    query: {},
  }),
  target: routes.experimentView.open,
});

sample({
  clock: nodeDeleteClicked,
  filter: ({ type, experimentId }) => type === 'experiment' && Boolean(experimentId),
  fn: ({ experimentId }) => ({ id: experimentId! }),
  target: deleteExperimentMutation.start,
});

sample({
  clock: nodeDeleteClicked,
  filter: ({ type }) => type === 'folder' || type === 'page',
  fn: ({ nodeId }) => ({ id: nodeId }),
  target: deleteWorkspaceNodeMutation.start,
});

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
});

sample({
  clock: moveWorkspaceNodeMutation.finished.success,
  target: nodeMoveModalClosed,
});

sample({
  clock: deleteWorkspaceNodeMutation.finished.success,
  source: {
    pageParams: routes.projectPageView.$params,
    target: $lastDeleteTarget,
    projectId: $projectId,
  },
  filter: ({ pageParams, target }) =>
    Boolean(target?.pageId && target.pageId === pageParams.pageId),
  fn: ({ projectId }) => ({
    params: { id: projectId! },
    query: {},
  }),
  target: routes.projectView.open,
});

sample({
  clock: deleteExperimentMutation.finished.success,
  source: {
    experimentParams: routes.experimentView.$params,
    target: $lastDeleteTarget,
    projectId: $projectId,
  },
  filter: ({ experimentParams, target }) =>
    Boolean(target?.experimentId && target.experimentId === experimentParams.experimentId),
  fn: ({ projectId }) => ({
    params: { id: projectId! },
    query: {},
  }),
  target: routes.projectView.open,
});

sample({
  clock: memberForm.validatedAndSubmitted,
  source: $projectId,
  filter: Boolean,
  fn: (projectId, values) => ({
    projectId: projectId!,
    email: values.email,
    role: values.role,
  }),
  target: addMemberMutation.start,
});

sample({
  clock: addMemberMutation.finished.success,
  target: memberModalClosed,
});

reset({
  clock: projectRouteClosed,
  target: [
    $memberModalOpened,
    $createExperimentModalOpened,
    $statusFilter,
    $searchQuery,
    $createParentNodeId,
    $moveModalOpened,
    $moveTarget,
    $lastDeleteTarget,
  ],
});

sample({
  clock: projectRouteClosed,
  target: [memberForm.reset, createExperimentForm.reset],
});

sample({
  clock: createExperimentModalClosed,
  target: createExperimentForm.reset,
});
