import { createLazyRouteView } from '@argon-router/react';
import { PageLoader } from '@/shared/ui/placeholders';
import { anonymousRoute } from './model';

export default createLazyRouteView({
  view: async () => import('./page'),
  route: anonymousRoute,
  fallback: PageLoader,
});
