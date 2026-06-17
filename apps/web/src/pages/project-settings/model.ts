import { sample } from 'effector'
import { isProjectSettingsTab } from '@/features/project-settings'
import { $canManage } from '@/features/project-sidebar/model'
import { routes } from '@/shared/routing'
import { chainAuthenticated } from '@/shared/viewer'

export const currentRoute = routes.projectSettings
export const authenticatedRoute = chainAuthenticated(currentRoute)

sample({
  clock: currentRoute.opened,
  filter: ({ params }) => !isProjectSettingsTab(params.tab),
  fn: ({ params }) => ({
    params: { projectId: params.projectId, tab: 'general' as const },
    query: {},
  }),
  target: currentRoute.open,
})

sample({
  clock: currentRoute.opened,
  source: $canManage,
  filter: (canManage, { params }) => params.tab === 'danger' && !canManage,
  fn: (_, { params }) => ({
    params: { projectId: params.projectId, tab: 'general' as const },
    query: {},
  }),
  target: currentRoute.open,
})
