import type { UserDto } from '@labcollab/shared'
import {
  Avatar,
  Box,
  Group,
  Menu,
  Switch,
  Text,
  UnstyledButton,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core'
import { IconLogout, IconMoon } from '@tabler/icons-react'
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

function ThemeSwitchMenuItem() {
  const { setColorScheme } = useMantineColorScheme()
  const computedColorScheme = useComputedColorScheme('light')
  const isDark = computedColorScheme === 'dark'

  return (
    <Menu.Item closeMenuOnClick={false} component="div">
      <Group justify="space-between" wrap="nowrap" gap="sm">
        <Group gap="xs" wrap="nowrap">
          <IconMoon size={16} stroke={1.5} />
          <Text size="sm">Тёмная тема</Text>
        </Group>
        <Switch
          size="sm"
          checked={isDark}
          onChange={event => setColorScheme(event.currentTarget.checked ? 'dark' : 'light')}
          aria-label="Тёмная тема"
        />
      </Group>
    </Menu.Item>
  )
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
          px={{ base: 0, sm: 'xs' }}
          py={4}
          styles={{
            root: {
              'borderRadius': 'var(--mantine-radius-default)',
              'transition': 'background-color 150ms ease',
              '&:hover': {
                backgroundColor: 'var(--mantine-color-default-hover)',
              },
            },
          }}
        >
          <Group gap="sm" wrap="nowrap">
            <Avatar radius="md" color="violet" variant="light" size="md">
              {userInitials(viewer)}
            </Avatar>
            <Box visibleFrom="sm" style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <Text size="sm" fw={600} lineClamp={1}>
                {userLabel(viewer)}
              </Text>
              <Text size="xs" c="dimmed" lineClamp={1}>
                {viewer.email}
              </Text>
            </Box>
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
        <ThemeSwitchMenuItem />
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
