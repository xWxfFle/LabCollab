import type { RouteView } from '@argon-router/react'
import { createAppRoutesView } from './routes-view'

const pages = import.meta.glob<true, string, { default: RouteView }>('./**/index.ts', {
  eager: true,
})

const routeViews = Object.values(pages).map(page => page.default)

const RoutesView = createAppRoutesView(routeViews)

export const Pages = () => <RoutesView />
