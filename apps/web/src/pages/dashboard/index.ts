import { createLazyRouteView } from '@argon-router/react';
import { PageLoader } from '@/shared/ui/placeholders';
import { authenticatedRoute } from './model';

export default createLazyRouteView({
  view: async () => import('./page'),
  route: authenticatedRoute,
  fallback: PageLoader,
});
