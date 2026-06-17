import { createLazyRouteView } from '@argon-router/react'
import { ProjectWorkspaceRouteFallback } from '@/layouts/project-workspace/route-fallback'
import { authenticatedRoute } from './model'

export default createLazyRouteView({
  view: async () => import('./page'),
  route: authenticatedRoute,
  fallback: ProjectWorkspaceRouteFallback,
})
