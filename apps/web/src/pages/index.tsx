import type { RouteView } from '@argon-router/react'
import { createAppRoutesView } from './routes-view'

const pages = import.meta.glob<true, string, { default: RouteView }>('./**/index.ts', {
  eager: true,
})

function isRouteView(module: { default: unknown }): module is { default: RouteView } {
  const view = module.default
  return view != null && typeof view === 'object' && 'route' in view
}

const routeViews = Object.values(pages).filter(isRouteView).map(page => page.default)

const RoutesView = createAppRoutesView(routeViews)

export const Pages = () => <RoutesView />
