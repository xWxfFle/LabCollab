import { createLazyRouteView } from '@argon-router/react';
import { PageLoader } from '@/shared/ui/placeholders';
import { currentRoute } from './model';

export default createLazyRouteView({
  view: async () => import('./page'),
  route: currentRoute,
  fallback: PageLoader,
});
