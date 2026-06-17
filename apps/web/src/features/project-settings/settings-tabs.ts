export const PROJECT_SETTINGS_TABS = ['general', 'members', 'danger'] as const

export type ProjectSettingsTab = typeof PROJECT_SETTINGS_TABS[number]

export const settingsTabLabels: Record<ProjectSettingsTab, string> = {
  general: 'Общее',
  members: 'Участники',
  danger: 'Опасная зона',
}

export function isProjectSettingsTab(tab: string): tab is ProjectSettingsTab {
  return (PROJECT_SETTINGS_TABS as readonly string[]).includes(tab)
}
