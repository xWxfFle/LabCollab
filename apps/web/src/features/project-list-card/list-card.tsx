import type { ProjectDto } from '@labcollab/shared'
import { Badge, Group, Paper, Stack, Text, ThemeIcon } from '@mantine/core'
import { IconChevronRight, IconFolder } from '@tabler/icons-react'
import { projectRoleMeta } from '@/shared/lib'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

interface ProjectListCardProps {
  project: ProjectDto
}

export function ProjectListCard({ project }: ProjectListCardProps) {
  const role = projectRoleMeta[project.role]

  return (
    <Paper
      withBorder
      radius="md"
      p="md"
      h="100%"
      styles={{
        root: {
          'transition': 'box-shadow 150ms ease, border-color 150ms ease, transform 150ms ease',
          'cursor': 'pointer',
          '&:hover': {
            boxShadow: 'var(--mantine-shadow-sm)',
            borderColor: 'var(--mantine-color-violet-4)',
            transform: 'translateY(-1px)',
          },
        },
      }}
    >
      <Stack gap="md" h="100%" justify="space-between">
        <Group align="flex-start" wrap="nowrap" gap="sm">
          <ThemeIcon variant="light" color="violet" size={40} radius="md">
            <IconFolder size={22} stroke={1.5} />
          </ThemeIcon>
          <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
            <Text fw={600} size="md" lineClamp={2} lh={1.3}>
              {project.name}
            </Text>
            {project.description
              ? (
                  <Text size="sm" c="dimmed" lineClamp={2} lh={1.45}>
                    {project.description}
                  </Text>
                )
              : (
                  <Text size="sm" c="dimmed" fs="italic">
                    Без описания
                  </Text>
                )}
          </Stack>
          <IconChevronRight
            size={18}
            stroke={1.5}
            style={{ flexShrink: 0, opacity: 0.45, marginTop: 2 }}
          />
        </Group>

        <Group justify="space-between" wrap="nowrap" gap="xs">
          <Badge variant="light" color={role.color} size="sm" radius="sm">
            {role.label}
          </Badge>
          <Text size="xs" c="dimmed">
            Создан
            {' '}
            {formatDate(project.createdAt)}
          </Text>
        </Group>
      </Stack>
    </Paper>
  )
}
