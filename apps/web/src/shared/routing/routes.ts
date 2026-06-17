import { createRoute } from '@argon-router/core'

export const routes = {
  login: createRoute({ path: '/login' }),
  register: createRoute({ path: '/register' }),
  dashboard: createRoute({ path: '/' }),
  projectView: createRoute({ path: '/projects/:id' }),
  projectPageView: createRoute({
    path: '/projects/:projectId/pages/:pageId',
  }),
  experimentView: createRoute({
    path: '/projects/:projectId/experiments/:experimentId',
  }),
  projectSettings: createRoute({
    path: '/projects/:projectId/settings/:tab',
  }),
}
