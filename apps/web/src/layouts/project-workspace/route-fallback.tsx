import { ProjectWorkspaceLayout } from './index'

/** Fallback lazy-маршрутов workspace: шапка и сайдбар остаются, крутится лоадер в main. */
export function ProjectWorkspaceRouteFallback() {
  return <ProjectWorkspaceLayout loading />
}
