import type { RouteView } from '@argon-router/react'
import { useOpenedViews } from '@argon-router/react'
import { useUnit } from 'effector-react'
import { createElement, useRef } from 'react'
import { $projectId } from '@/features/project-sidebar'
import { AppShellRouteFallback } from '@/layouts/app-shell/route-fallback'
import { ProjectWorkspaceRouteFallback } from '@/layouts/project-workspace/route-fallback'
import { router } from '@/shared/routing'
import { RouteOtherwise } from './route-otherwise'
import { createAnyRouteViewPending } from './routing-gate'

function isProjectNavigationContext({
  path,
  projectId,
}: {
  path: string | null
  projectId: string | null
}) {
  return projectId != null || (path?.includes('/projects/') ?? false)
}

export function createAppRoutesView(routeViews: RouteView[]) {
  const $anyRouteViewPending = createAnyRouteViewPending(routeViews)

  return function AppRoutesView() {
    const openedView = useOpenedViews(routeViews).at(-1)
    const staleViewRef = useRef<RouteView | null>(openedView ?? null)
    if (openedView)
      staleViewRef.current = openedView

    const [path, anyPending, projectId] = useUnit([
      router.$path,
      $anyRouteViewPending,
      $projectId,
    ])

    const inProjectContext = isProjectNavigationContext({ path, projectId })
    const inTransition = !openedView && (anyPending || inProjectContext)
    const view = openedView ?? (inTransition ? staleViewRef.current : null)

    if (view)
      return createElement(view.view)

    if (inTransition) {
      return inProjectContext
        ? <ProjectWorkspaceRouteFallback />
        : <AppShellRouteFallback />
    }

    return <RouteOtherwise />
  }
}
