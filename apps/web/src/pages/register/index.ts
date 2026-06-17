import { createLazyRouteView } from '@argon-router/react'
import { PageLoader } from '@/shared/ui/placeholders'
import { registerAnonymousRoute } from '../login/model'

export default createLazyRouteView({
  view: async () => import('../login/page'),
  route: registerAnonymousRoute,
  fallback: PageLoader,
})
