import type { ProjectRole } from '@labcollab/shared'

export const projectRoleLabels: Record<ProjectRole, string> = {
  owner: 'Владелец',
  editor: 'Редактор',
  viewer: 'Наблюдатель',
}

export const projectRoleMeta: Record<ProjectRole, { label: string, color: string }> = {
  owner: { label: projectRoleLabels.owner, color: 'violet' },
  editor: { label: projectRoleLabels.editor, color: 'blue' },
  viewer: { label: projectRoleLabels.viewer, color: 'gray' },
}
