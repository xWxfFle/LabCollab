import type { ProjectPageVersionDto } from '@labcollab/shared'
import { createEvent, createStore, restore, sample } from 'effector'
import { debounce, reset } from 'patronum'
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
export const exportPdfClicked = createEvent()
export const exportMdClicked = createEvent()
export const versionSelected = createEvent<ProjectPageVersionDto>()
export const versionModalClosed = createEvent()

export const $title = createStore('')
export const $bodyHtml = createStore('')

export const $canEdit = projectQuery.$data.map(p => p != null && p.role !== 'viewer')
export const $isSaving = patchPageMutation.$pending

export const $versionModalOpened = createStore(false)
  .on(versionSelected, () => true)
  .reset(versionModalClosed)

export const $selectedVersion = restore(versionSelected, null as ProjectPageVersionDto | null)
  .reset(versionModalClosed)

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
  clock: patchPageMutation.finished.success,
  source: currentRoute.$params,
  filter: ({ pageId }) => Boolean(pageId),
  fn: ({ pageId }) => ({ pageId }),
  target: pageVersionsQuery.start,
})

sample({
  clock: projectPageQuery.$data,
  filter: Boolean,
  fn: page => page!.title,
  target: $title,
})

sample({
  clock: projectPageQuery.$data,
  filter: Boolean,
  fn: page => page!.bodyHtml,
  target: $bodyHtml,
})

const titleDebounced = debounce({ source: titleChanged, timeout: 1500 })
const bodyDebounced = debounce({ source: bodyChanged, timeout: 1500 })

sample({
  clock: titleDebounced,
  source: { params: currentRoute.$params, title: $title },
  filter: ({ params }) => Boolean(params.pageId),
  fn: ({ params, title }) => ({ id: params.pageId, title }),
  target: patchPageMutation.start,
})

sample({
  clock: bodyDebounced,
  source: { params: currentRoute.$params, bodyHtml: $bodyHtml },
  filter: ({ params }) => Boolean(params.pageId),
  fn: ({ params, bodyHtml }) => ({ id: params.pageId, bodyHtml }),
  target: patchPageMutation.start,
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
  target: [$title, $bodyHtml, $selectedVersion, $versionModalOpened],
})
