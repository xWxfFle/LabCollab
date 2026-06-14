import type { RouteView } from '@argon-router/react';
import { createRoutesView } from '@argon-router/react';
import { useUnit } from 'effector-react';
import { useEffect } from 'react';
import { PageLoader } from '@/shared/ui/placeholders';
import { router, routes } from '@/shared/routing';

const pages = import.meta.glob<true, string, { default: RouteView }>('./**/index.ts', {
  eager: true,
});

const routeViews = Object.values(pages).map((page) => page.default);

function RouteOtherwise() {
  const activeRoutes = useUnit(router.$activeRoutes);

  useEffect(() => {
    // Виртуальный маршрут (chainRoute) открывается позже базового — не редиректить в этот промежуток.
    if (activeRoutes.length === 0) {
      routes.dashboard.open();
    }
  }, [activeRoutes.length]);

  return <PageLoader />;
}

const RoutesView = createRoutesView({
  routes: routeViews,
  otherwise: RouteOtherwise,
});

export const Pages = () => <RoutesView />;
