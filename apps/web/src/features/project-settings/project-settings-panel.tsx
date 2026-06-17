import type { ProjectSettingsTab } from './settings-tabs'
import { Box, Divider, Group } from '@mantine/core'
import { DangerSettingsTab } from './danger-settings-tab'
import { GeneralSettingsTab } from './general-settings-tab'
import { MembersSettingsTab } from './members-settings-tab'
import { SettingsNav } from './settings-nav'

interface ProjectSettingsPanelProps {
  projectId: string
  activeTab: ProjectSettingsTab
}

function SettingsTabContent({ tab }: { tab: ProjectSettingsTab }) {
  switch (tab) {
    case 'general':
      return <GeneralSettingsTab />
    case 'members':
      return <MembersSettingsTab />
    case 'danger':
      return <DangerSettingsTab />
  }
}

export function ProjectSettingsPanel({ projectId, activeTab }: ProjectSettingsPanelProps) {
  return (
    <Group align="flex-start" wrap="nowrap" gap="xl" maw={960} mx="auto" w="100%">
      <SettingsNav projectId={projectId} activeTab={activeTab} />
      <Divider orientation="vertical" visibleFrom="sm" />
      <Box style={{ flex: 1, minWidth: 0 }}>
        <SettingsTabContent tab={activeTab} />
      </Box>
    </Group>
  )
}
