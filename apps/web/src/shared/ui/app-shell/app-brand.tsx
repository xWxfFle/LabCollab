import { Group, Text, ThemeIcon } from '@mantine/core'
import { IconFlask } from '@tabler/icons-react'
import { RouteLink, routes } from '@/shared/routing'

interface AppBrandProps {
  /** На узком экране — только иконка (рядом с burger). */
  compact?: boolean
}

export function AppBrand({ compact = false }: AppBrandProps) {
  return (
    <RouteLink to={routes.dashboard}>
      <Group gap="sm" wrap="nowrap" style={{ cursor: 'pointer', minWidth: 0 }}>
        <ThemeIcon
          size="lg"
          radius="md"
          variant="gradient"
          gradient={{ from: 'violet', to: 'grape', deg: 135 }}
        >
          <IconFlask size={20} stroke={1.75} />
        </ThemeIcon>
        <Text
          component="span"
          fw={700}
          size="lg"
          lh={1}
          visibleFrom={compact ? 'sm' : undefined}
        >
          LabCollab
        </Text>
      </Group>
    </RouteLink>
  )
}
