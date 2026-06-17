import type { ProjectPageDto, ProjectPageVersionDto } from '@labcollab/shared'
import { combine, createEvent, createStore, restore, sample } from 'effector'
import { reset } from 'patronum'
import { workspaceRefreshRequested } from '@/features/project-sidebar'
import {
  downloadPageMdFx,
  downloadPagePdfFx,
  pageVersionsQuery,
  patchPageMutation,
  projectPageQuery,
  projectQuery,
  savePageExportFx,
} from '@/shared/api'
import { debouncedRouteOpened, routes } from '@/shared/routing'
import { chainAuthenticated } from '@/shared/viewer'

export const currentRoute = routes.projectPageView
export const authenticatedRoute = chainAuthenticated(currentRoute)
export const routeOpened = debouncedRouteOpened(currentRoute)

export const titleChanged = createEvent<string>()
export const bodyChanged = createEvent<string>()
export const saveRequested = createEvent()
export const exportPdfClicked = createEvent()
export const exportMdClicked = createEvent()
export const versionSelected = createEvent<ProjectPageVersionDto>()
export const versionModalClosed = createEvent()

export const $title = createStore('')
export const $bodyHtml = createStore('')

interface PageBaseline {
  title: string
  bodyHtml: string
}

export const $savedBaseline = createStore<PageBaseline | null>(null)

export const $isDirty = combine(
  { baseline: $savedBaseline, title: $title, bodyHtml: $bodyHtml },
  ({ baseline, title, bodyHtml }) => {
    if (!baseline)
      return false
    return baseline.title !== title || baseline.bodyHtml !== bodyHtml
  },
)

export const $canEdit = projectQuery.$data.map(p => p != null && p.role !== 'viewer')
export const $isSaving = patchPageMutation.$pending

export const $versionModalOpened = createStore(false)
  .on(versionSelected, () => true)
  .reset(versionModalClosed)

export const $selectedVersion = restore(versionSelected, null as ProjectPageVersionDto | null)
  .reset(versionModalClosed)

function baselineFromPage(page: ProjectPageDto): PageBaseline {
  return {
    title: page.title,
    bodyHtml: page.bodyHtml,
  }
}

sample({
  clock: routeOpened,
  fn: ({ params }) => ({ id: params.pageId }),
  target: projectPageQuery.start,
})

sample({
  clock: routeOpened,
  fn: ({ params }) => ({ id: params.projectId }),
  target: projectQuery.start,
})

sample({
  clock: routeOpened,
  fn: ({ params }) => ({ pageId: params.pageId }),
  target: pageVersionsQuery.start,
})

sample({
  clock: projectPageQuery.finished.success,
  fn: ({ result }) => result.title,
  target: $title,
})

sample({
  clock: projectPageQuery.finished.success,
  fn: ({ result }) => result.bodyHtml,
  target: $bodyHtml,
})

sample({
  clock: projectPageQuery.finished.success,
  fn: ({ result }) => baselineFromPage(result),
  target: $savedBaseline,
})

sample({
  clock: titleChanged,
  target: $title,
})

sample({
  clock: bodyChanged,
  target: $bodyHtml,
})

sample({
  clock: saveRequested,
  source: {
    params: currentRoute.$params,
    canEdit: $canEdit,
    title: $title,
    bodyHtml: $bodyHtml,
  },
  filter: ({ params, canEdit }) => canEdit && Boolean(params.pageId),
  fn: ({ params, title, bodyHtml }) => ({
    id: params.pageId,
    title,
    bodyHtml,
  }),
  target: patchPageMutation.start,
})

sample({
  clock: patchPageMutation.finished.success,
  fn: ({ result }) => baselineFromPage(result),
  target: $savedBaseline,
})

sample({
  clock: patchPageMutation.finished.success,
  fn: ({ result }) => result.title,
  target: $title,
})

sample({
  clock: patchPageMutation.finished.success,
  fn: ({ result }) => result.bodyHtml,
  target: $bodyHtml,
})

sample({
  clock: patchPageMutation.finished.success,
  source: currentRoute.$params,
  filter: ({ pageId }) => Boolean(pageId),
  fn: ({ pageId }) => ({ id: pageId }),
  target: projectPageQuery.start,
})

sample({
  clock: patchPageMutation.finished.success,
  source: currentRoute.$params,
  filter: ({ pageId }) => Boolean(pageId),
  fn: ({ pageId }) => ({ pageId }),
  target: pageVersionsQuery.start,
})

sample({
  clock: patchPageMutation.finished.success,
  target: workspaceRefreshRequested,
})

sample({
  clock: exportPdfClicked,
  source: currentRoute.$params,
  filter: ({ pageId }) => Boolean(pageId),
  fn: ({ pageId }) => ({ pageId }),
  target: downloadPagePdfFx,
})

sample({
  clock: exportMdClicked,
  source: currentRoute.$params,
  filter: ({ pageId }) => Boolean(pageId),
  fn: ({ pageId }) => ({ pageId }),
  target: downloadPageMdFx,
})

sample({
  clock: downloadPagePdfFx.done,
  fn: ({ params, result }) => ({
    blob: result,
    pageId: params.pageId,
    extension: 'pdf' as const,
  }),
  target: savePageExportFx,
})

sample({
  clock: downloadPageMdFx.done,
  fn: ({ params, result }) => ({
    blob: new Blob([result], { type: 'text/markdown;charset=utf-8' }),
    pageId: params.pageId,
    extension: 'md' as const,
  }),
  target: savePageExportFx,
})

reset({
  clock: currentRoute.closed,
  target: [$title, $bodyHtml, $savedBaseline, $selectedVersion, $versionModalOpened],
})
