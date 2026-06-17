import { Group, Text, ThemeIcon } from '@mantine/core'
import { IconFlask } from '@tabler/icons-react'
import { RouteLink, routes } from '@/shared/routing'

export function AppBrand() {
  return (
    <RouteLink to={routes.dashboard}>
      <Group gap="sm" wrap="nowrap" style={{ cursor: 'pointer' }}>
        <ThemeIcon
          size="lg"
          radius="md"
          variant="gradient"
          gradient={{ from: 'violet', to: 'grape', deg: 135 }}
        >
          <IconFlask size={20} stroke={1.75} />
        </ThemeIcon>
        <Text component="span" fw={700} size="lg" lh={1}>
          LabCollab
        </Text>
      </Group>
    </RouteLink>
  )
}
