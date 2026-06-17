import type { ProjectSettingsTab } from './settings-tabs'
import { useLink, useRouter } from '@argon-router/react'
import { Box, NavLink, Stack, Text, Title } from '@mantine/core'
import {
  IconAlertTriangle,
  IconSettings,
  IconUsers,
} from '@tabler/icons-react'
import { useUnit } from 'effector-react'
import { $canManage } from '@/features/project-sidebar/model'
import { routes } from '@/shared/routing'
import { settingsTabLabels } from './settings-tabs'

const tabIcons: Record<ProjectSettingsTab, typeof IconSettings> = {
  general: IconSettings,
  members: IconUsers,
  danger: IconAlertTriangle,
}

interface SettingsNavProps {
  projectId: string
  activeTab: ProjectSettingsTab
}

function SettingsNavItem({
  projectId,
  tab,
  active,
}: {
  projectId: string
  tab: ProjectSettingsTab
  active: boolean
}) {
  const { path } = useLink(routes.projectSettings, { projectId, tab })
  const { onNavigate } = useRouter()
  const Icon = tabIcons[tab]

  return (
    <NavLink
      href={path}
      label={settingsTabLabels[tab]}
      leftSection={<Icon size={18} stroke={1.5} />}
      active={active}
      variant={active ? 'light' : 'subtle'}
      color={tab === 'danger' ? 'red' : 'violet'}
      styles={{
        root: {
          borderRadius: 'var(--mantine-radius-default)',
        },
      }}
      onClick={(event) => {
        if (
          event.defaultPrevented
          || event.metaKey
          || event.altKey
          || event.ctrlKey
          || event.shiftKey
        ) {
          return
        }
        event.preventDefault()
        onNavigate({ path, query: {} })
      }}
    />
  )
}

export function SettingsNav({ projectId, activeTab }: SettingsNavProps) {
  const canManage = useUnit($canManage)

  const tabs: ProjectSettingsTab[] = canManage
    ? ['general', 'members', 'danger']
    : ['general', 'members']

  return (
    <Box w={220} style={{ flexShrink: 0 }}>
      <Title order={4} mb="md">
        Настройки
      </Title>
      <Stack gap={4}>
        {tabs.map(tab => (
          <SettingsNavItem
            key={tab}
            projectId={projectId}
            tab={tab}
            active={activeTab === tab}
          />
        ))}
      </Stack>
      <Text size="xs" c="dimmed" mt="lg">
        Управление проектом и доступом участников
      </Text>
    </Box>
  )
}
