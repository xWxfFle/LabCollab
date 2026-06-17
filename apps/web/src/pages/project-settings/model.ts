import { sample } from 'effector'
import { templatesLoadRequested } from '@/features/experiment-template-editor/model'
import { isProjectSettingsTab } from '@/features/project-settings'
import { $canManage } from '@/features/project-sidebar/model'
import { routes } from '@/shared/routing'
import { chainAuthenticated } from '@/shared/viewer'

export const currentRoute = routes.projectSettings
export const authenticatedRoute = chainAuthenticated(currentRoute)

sample({
  clock: currentRoute.opened,
  filter: ({ params }) => !isProjectSettingsTab(params.tab),
  fn: ({ params, query }) => ({
    params: { projectId: params.projectId, tab: 'general' as const },
    query: query ?? {},
  }),
  target: currentRoute.open,
})

sample({
  clock: currentRoute.opened,
  source: $canManage,
  filter: (canManage, { params }) => params.tab === 'danger' && !canManage,
  fn: (_, { params, query }) => ({
    params: { projectId: params.projectId, tab: 'general' as const },
    query: query ?? {},
  }),
  target: currentRoute.open,
})

sample({
  clock: currentRoute.opened,
  filter: ({ params }) => params.tab === 'templates',
  fn: ({ params }) => ({ scope: 'project' as const, projectId: params.projectId }),
  target: templatesLoadRequested,
})
