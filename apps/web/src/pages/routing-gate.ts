import type { RouteView } from '@argon-router/react'
import type { Store } from 'effector'
import { is } from '@argon-router/core'
import { combine } from 'effector'
import { router } from '@/shared/routing'

function collectRoutePendingStores(routeViews: RouteView[]): Store<boolean>[] {
  return routeViews.flatMap((view) => {
    const ownStores = is.route(view.route) ? [view.route.$isPending] : []
    const childStores = view.children ? collectRoutePendingStores(view.children) : []

    return [...ownStores, ...childStores]
  })
}

export function createAnyRouteViewPending(routeViews: RouteView[]) {
  const pendingStores = collectRoutePendingStores(routeViews)

  if (pendingStores.length === 0)
    return combine(() => false)

  return combine(pendingStores, (...pending) => pending.some(Boolean))
}

export const $isProjectPath = router.$path.map(path => path?.includes('/projects/') ?? false)
