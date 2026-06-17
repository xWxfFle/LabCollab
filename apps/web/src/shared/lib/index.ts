export function noop() {}

export function confirmAction(message: string): boolean {
  // eslint-disable-next-line no-alert
  return window.confirm(message)
}

export { experimentStatusLabels, experimentStatusMeta } from './experiment-status'
export { projectRoleLabels, projectRoleMeta } from './project-role'
