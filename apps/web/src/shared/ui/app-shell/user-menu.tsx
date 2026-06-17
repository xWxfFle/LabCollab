import type { UserDto } from '@labcollab/shared'
import { Avatar, Group, Menu, Text, UnstyledButton } from '@mantine/core'
import { IconLogout } from '@tabler/icons-react'
import { useUnit } from 'effector-react'
import { $viewer, signedOut } from '@/shared/viewer'

function userInitials(user: UserDto) {
  const name = user.displayName.trim()
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }
  return user.email.slice(0, 2).toUpperCase()
}

function userLabel(user: UserDto) {
  return user.displayName.trim() || user.email
}

export function UserMenu() {
  const [viewer, logout] = useUnit([$viewer, signedOut])

  if (!viewer) {
    return null
  }

  return (
    <Menu position="bottom-end" withinPortal width={260}>
      <Menu.Target>
        <UnstyledButton
          px="xs"
          py={4}
          styles={{
            root: {
              'borderRadius': 'var(--mantine-radius-default)',
              'transition': 'background-color 150ms ease',
              '&:hover': {
                backgroundColor: 'var(--mantine-color-gray-0)',
              },
            },
          }}
        >
          <Group gap="sm" wrap="nowrap">
            <Avatar radius="md" color="violet" variant="light" size="md">
              {userInitials(viewer)}
            </Avatar>
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <Text size="sm" fw={600} lineClamp={1}>
                {userLabel(viewer)}
              </Text>
              <Text size="xs" c="dimmed" lineClamp={1}>
                {viewer.email}
              </Text>
            </div>
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>
          <Text size="sm" fw={600} lineClamp={1}>
            {userLabel(viewer)}
          </Text>
          <Text size="xs" c="dimmed" lineClamp={1}>
            {viewer.email}
          </Text>
        </Menu.Label>
        <Menu.Divider />
        <Menu.Item
          color="red"
          leftSection={<IconLogout size={16} stroke={1.5} />}
          onClick={() => logout()}
        >
          Выйти
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
