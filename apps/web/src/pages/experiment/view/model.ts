import type { ExperimentDto, ExperimentVersionDto } from '@labcollab/shared';
import { createForm } from '@effector-reform/core';
import { createEvent, createEffect, createStore, sample } from 'effector';
import { debounce, reset } from 'patronum';
import {
  attachmentsQuery,
  experimentQuery,
  patchExperimentMutation,
  versionsQuery,
} from '@/shared/api/experiments';
import { commentsQuery, createCommentMutation } from '@/shared/api/comments';
import { projectQuery } from '@/shared/api';
import { downloadPdfFx, downloadAttachmentFx, uploadAttachmentFx } from '@/shared/api/attachments';
import { debouncedRouteOpened, routes } from '@/shared/routing';
import { chainAuthenticated } from '@/shared/viewer';
import { workspaceRefreshRequested } from '@/layouts/project-workspace/model';

export const currentRoute = routes.experimentView;
export const authenticatedRoute = chainAuthenticated(currentRoute);
export const routeOpened = debouncedRouteOpened(currentRoute);

const $routeOpen = createStore(false)
  .on(currentRoute.opened, () => true)
  .on(currentRoute.closed, () => false);

export const observationsTextChanged = createEvent<string>();
export const exportPdfClicked = createEvent();
export const fileSelected = createEvent<File>();
export const versionSelected = createEvent<ExperimentVersionDto>();
export const versionModalClosed = createEvent();
export const attachmentDownloadClicked = createEvent<{ id: string; filename: string }>();
export const tagsChanged = createEvent<string[]>();
export const commentSubmitted = createEvent<string>();

export const $observationsText = createStore('')
  .on(observationsTextChanged, (_, text) => text);

export const $tags = createStore<string[]>([]).on(tagsChanged, (_, tags) => tags);

export const $canEdit = createStore(false);
export const $versionModalOpened = createStore(false)
  .on(versionSelected, () => true)
  .on(versionModalClosed, () => false);

export const $selectedVersion = createStore<ExperimentVersionDto | null>(null)
  .on(versionSelected, (_, version) => version)
  .reset(versionModalClosed);

export const $isSaving = patchExperimentMutation.$pending;

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
});

const metadataChanged = debounce({
  source: metadataForm.changed,
  timeout: 2000,
});

const observationsChanged = debounce({
  source: observationsTextChanged,
  timeout: 2000,
});

const tagsDebounced = debounce({
  source: tagsChanged,
  timeout: 2000,
});

sample({
  clock: routeOpened,
  fn: ({ params }) => ({ id: params.experimentId }),
  target: experimentQuery.start,
});

sample({
  clock: routeOpened,
  fn: ({ params }) => ({ id: params.projectId }),
  target: projectQuery.start,
});

sample({
  clock: routeOpened,
  fn: ({ params }) => ({ experimentId: params.experimentId }),
  target: [versionsQuery.start, attachmentsQuery.start, commentsQuery.start],
});

sample({
  clock: projectQuery.finished.success,
  fn: ({ result }) => result.role !== 'viewer',
  target: $canEdit,
});

sample({
  clock: currentRoute.closed,
  fn: () => false,
  target: $canEdit,
});

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
});

sample({
  clock: experimentQuery.finished.success,
  fn: ({ result }: { result: ExperimentDto }) => result.observationsText ?? '',
  target: $observationsText,
});

sample({
  clock: experimentQuery.finished.success,
  fn: ({ result }: { result: ExperimentDto }) => result.tags ?? [],
  target: $tags,
});

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
});

sample({
  clock: commentSubmitted,
  source: currentRoute.$params,
  fn: (params, body) => ({
    experimentId: params.experimentId,
    body,
  }),
  target: createCommentMutation.start,
});

sample({
  clock: createCommentMutation.finished.success,
  source: currentRoute.$params,
  fn: (params) => ({ experimentId: params.experimentId }),
  target: commentsQuery.start,
});

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
});

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
});

sample({
  clock: patchExperimentMutation.finished.success,
  source: currentRoute.$params,
  fn: (params) => ({ experimentId: params.experimentId }),
  target: versionsQuery.start,
});

sample({
  clock: patchExperimentMutation.finished.success,
  target: workspaceRefreshRequested,
});

sample({
  clock: exportPdfClicked,
  source: { params: currentRoute.$params, observations: $observationsText },
  fn: ({ params, observations }) => ({
    experimentId: params.experimentId,
    observationsText: observations,
  }),
  target: downloadPdfFx,
});

sample({
  clock: fileSelected,
  source: { params: currentRoute.$params, canEdit: $canEdit },
  filter: ({ canEdit }) => canEdit,
  fn: ({ params }, file) => ({ experimentId: params.experimentId, file }),
  target: uploadAttachmentFx,
});

sample({
  clock: uploadAttachmentFx.done,
  source: currentRoute.$params,
  fn: (params) => ({ experimentId: params.experimentId }),
  target: attachmentsQuery.start,
});

const savePdfFx = createEffect(
  ({ blob, experimentId }: { blob: Blob; experimentId: string }) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `experiment-${experimentId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },
);

sample({
  clock: downloadPdfFx.done,
  fn: ({ params, result }) => ({
    blob: result,
    experimentId: params.experimentId,
  }),
  target: savePdfFx,
});

sample({
  clock: attachmentDownloadClicked,
  fn: ({ id, filename }) => ({ attachmentId: id, filename }),
  target: downloadAttachmentFx,
});

sample({
  clock: currentRoute.closed,
  target: metadataForm.reset,
});

reset({
  clock: currentRoute.closed,
  target: [$observationsText, $tags],
});
