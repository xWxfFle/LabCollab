import type { RouteView } from '@argon-router/react'
import { combine } from 'effector'
import { router } from '@/shared/routing'

export function createAnyRouteViewPending(routeViews: RouteView[]) {
  return combine(
    routeViews.map(view => view.route.$isPending),
    (...pending) => pending.some(Boolean),
  )
}

export const $isProjectPath = router.$path.map(path => path?.includes('/projects/') ?? false)
