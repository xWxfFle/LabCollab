export function noop() {}

export function confirmAction(message: string): boolean {
  // eslint-disable-next-line no-alert
  return window.confirm(message)
}

export {
  experimentStatusFilterOptions,
  experimentStatusLabels,
  experimentStatusMeta,
  experimentStatusShortLabels,
} from './experiment-status'
export { stripHtml } from './html'
export { projectRoleLabels, projectRoleMeta } from './project-role'
export {
  experimentVersionPreview,
  formatVersionDate,
  type VersionHistoryItem,
} from './version-history'
