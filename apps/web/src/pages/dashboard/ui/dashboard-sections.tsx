import type { ProjectDto } from '@labcollab/shared'
import {
  Button,
  Grid,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { IconFolderPlus, IconPlus, IconUsers } from '@tabler/icons-react'
import { ExperimentTemplateManager } from '@/features/experiment-template-editor'
import { ProjectListCard } from '@/features/project-list-card'
import { RouteLink, routes } from '@/shared/routing'

function DashboardStats({ projects }: { projects: ProjectDto[] }) {
  const owned = projects.filter(p => p.role === 'owner').length
  const shared = projects.length - owned

  const items = [
    { label: 'Всего проектов', value: projects.length },
    { label: 'Мои проекты', value: owned },
    { label: 'С доступом', value: shared, withUsersIcon: true },
  ] as const

  return (
    <Stack gap="sm">
      {items.map(item => (
        <Paper key={item.label} withBorder radius="md" p="md">
          <Group gap="xs" mb={4}>
            {'withUsersIcon' in item && item.withUsersIcon && (
              <IconUsers size={14} stroke={1.5} style={{ opacity: 0.5 }} />
            )}
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
              {item.label}
            </Text>
          </Group>
          <Text size="xl" fw={700} lh={1}>
            {item.value}
          </Text>
        </Paper>
      ))}
    </Stack>
  )
}

function ProjectSection({
  title,
  projects,
}: {
  title: string
  projects: ProjectDto[]
}) {
  if (projects.length === 0)
    return null

  return (
    <Stack gap="sm">
      <Text fw={600} size="sm" c="dimmed" tt="uppercase">
        {title}
      </Text>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        {projects.map(project => (
          <RouteLink
            key={project.id}
            to={routes.projectView}
            params={{ id: project.id }}
          >
            <ProjectListCard project={project} />
          </RouteLink>
        ))}
      </SimpleGrid>
    </Stack>
  )
}

export function ProjectsEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Paper withBorder radius="md" p="xl" ta="center">
      <ThemeIcon size={52} radius="md" variant="light" color="violet" mx="auto" mb="md">
        <IconFolderPlus size={28} stroke={1.5} />
      </ThemeIcon>
      <Text fw={600} mb={4}>
        Пока нет проектов
      </Text>
      <Text size="sm" c="dimmed" maw={360} mx="auto" mb="lg">
        Создайте лабораторный проект — страницы, эксперименты и совместная работа в одном месте.
      </Text>
      <Button onClick={onCreate}>Создать первый проект</Button>
    </Paper>
  )
}

interface DashboardSidebarProps {
  projects: ProjectDto[]
  onCreateProject: () => void
}

export function DashboardSidebar({ projects, onCreateProject }: DashboardSidebarProps) {
  return (
    <Stack
      gap="md"
      style={{
        position: 'sticky',
        top: 'calc(var(--app-shell-header-height, 56px) + var(--mantine-spacing-md))',
      }}
    >
      {projects.length > 0 && <DashboardStats projects={projects} />}

      <Paper withBorder radius="md" p="md">
        <Stack gap="sm">
          <Text fw={600} size="sm">
            Быстрые действия
          </Text>
          <Button
            fullWidth
            leftSection={<IconPlus size={16} />}
            onClick={onCreateProject}
          >
            Создать проект
          </Button>
        </Stack>
      </Paper>

      <Paper withBorder radius="md" p="md">
        <ExperimentTemplateManager
          scope="user"
          title="Мои шаблоны"
          variant="sidebar"
        />
      </Paper>
    </Stack>
  )
}

interface DashboardProjectsColumnProps {
  projects: ProjectDto[]
  onCreateProject: () => void
}

export function DashboardProjectsColumn({
  projects,
  onCreateProject,
}: DashboardProjectsColumnProps) {
  const owned = projects.filter(p => p.role === 'owner')
  const shared = projects.filter(p => p.role !== 'owner')

  if (projects.length === 0)
    return <ProjectsEmptyState onCreate={onCreateProject} />

  return (
    <Stack gap="xl">
      <ProjectSection title="Мои проекты" projects={owned} />
      <ProjectSection title="Совместные" projects={shared} />
    </Stack>
  )
}

interface DashboardPageHeaderProps {
  greetingName?: string
}

export function DashboardPageHeader({ greetingName }: DashboardPageHeaderProps) {
  const name = greetingName ?? 'исследователь'

  return (
    <Stack gap={6} py="xs">
      <Title order={1} size="h2" lh={1.2}>
        Привет,
        {' '}
        {name}
      </Title>
      <Text size="lg" c="dimmed">
        Ваши лабораторные проекты и шаблоны экспериментов
      </Text>
    </Stack>
  )
}

export function DashboardMainGrid({
  projects,
  onCreateProject,
}: {
  projects: ProjectDto[]
  onCreateProject: () => void
}) {
  return (
    <Grid gap="xl" align="flex-start">
      <Grid.Col span={{ base: 12, lg: 8 }}>
        <DashboardProjectsColumn
          projects={projects}
          onCreateProject={onCreateProject}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, lg: 4 }}>
        <DashboardSidebar
          projects={projects}
          onCreateProject={onCreateProject}
        />
      </Grid.Col>
    </Grid>
  )
}
