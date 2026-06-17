import type { ProjectDto } from '@labcollab/shared'

import { useForm } from '@effector-reform/react'

import {

  Button,

  Group,

  Modal,

  Paper,

  SimpleGrid,

  Skeleton,

  Stack,

  Text,

  Textarea,

  TextInput,

  ThemeIcon,

  Title,

} from '@mantine/core'

import { IconFolderPlus, IconUsers } from '@tabler/icons-react'

import { useUnit } from 'effector-react'

import { ProjectListCard } from '@/features/project-list-card'

import { AppShellLayout } from '@/layouts/app-shell'

import { RouteLink, routes } from '@/shared/routing'

import { $viewer } from '@/shared/viewer'

import {

  $createModalOpened,

  createFormModel,

  createModalClosed,

  createModalOpened,

  createProjectMutation,

  projectsQuery,

} from './model'

function DashboardStats({ projects }: { projects: ProjectDto[] }) {
  const owned = projects.filter(p => p.role === 'owner').length

  const shared = projects.length - owned

  return (

    <SimpleGrid cols={{ base: 1, xs: 3 }} spacing="md">

      <Paper withBorder radius="md" p="md">

        <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>

          Всего проектов

        </Text>

        <Text size="xl" fw={700} lh={1}>

          {projects.length}

        </Text>

      </Paper>

      <Paper withBorder radius="md" p="md">

        <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>

          Мои проекты

        </Text>

        <Text size="xl" fw={700} lh={1}>

          {owned}

        </Text>

      </Paper>

      <Paper withBorder radius="md" p="md">

        <Group gap="xs" mb={4}>

          <IconUsers size={14} stroke={1.5} style={{ opacity: 0.5 }} />

          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>

            С доступом

          </Text>

        </Group>

        <Text size="xl" fw={700} lh={1}>

          {shared}

        </Text>

      </Paper>

    </SimpleGrid>

  )
}

function ProjectsEmptyState({ onCreate }: { onCreate: () => void }) {
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

export default function DashboardPage() {
  const [projects, pending, createPending, modalOpened, viewer] = useUnit([

    projectsQuery.$data,

    projectsQuery.$pending,

    createProjectMutation.$pending,

    $createModalOpened,

    $viewer,

  ])

  const openModal = useUnit(createModalOpened)

  const closeModal = useUnit(createModalClosed)

  const { fields, onSubmit, errors } = useForm(createFormModel)

  const list = (projects ?? []) as ProjectDto[]

  const greetingName = viewer?.displayName?.trim() || viewer?.email

  return (

    <AppShellLayout>

      <Stack gap="xl" maw={1200}>

        <Paper

          withBorder

          radius="md"

          p="lg"

          style={{

            background: 'linear-gradient(135deg, var(--mantine-color-violet-0) 0%, var(--mantine-color-body) 70%)',

          }}

        >

          <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">

            <Stack gap={4}>

              <Title order={2}>Проекты</Title>

              {greetingName && (

                <Text c="dimmed">

                  Привет,

                  {' '}

                  {greetingName}

                </Text>

              )}

            </Stack>

            <Button onClick={() => openModal()}>Создать проект</Button>

          </Group>

        </Paper>

        {pending && (

          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">

            {Array.from({ length: 3 }, (_, i) => (

              <Skeleton key={i} height={140} radius="md" />

            ))}

          </SimpleGrid>

        )}

        {!pending && list.length > 0 && <DashboardStats projects={list} />}

        {!pending && list.length > 0 && (

          <Stack gap="sm">

            <Text fw={600} size="sm" c="dimmed" tt="uppercase">

              Ваши проекты

            </Text>

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">

              {list.map(project => (

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

        )}

        {!pending && list.length === 0 && (

          <ProjectsEmptyState onCreate={() => openModal()} />

        )}

      </Stack>

      <Modal opened={modalOpened} onClose={() => closeModal()} title="Новый проект">

        <form onSubmit={onSubmit}>

          <Stack>

            <TextInput

              label="Название"

              value={fields.name.value}

              onChange={e => fields.name.onChange(e.currentTarget.value)}

              onBlur={fields.name.onBlur}

              error={typeof errors.name === 'string' ? errors.name : undefined}

              required

            />

            <Textarea

              label="Описание"

              value={fields.description.value}

              onChange={e => fields.description.onChange(e.currentTarget.value)}

              onBlur={fields.description.onBlur}

            />

            <Button type="submit" loading={createPending} disabled={!fields.name.value.trim()}>

              Создать

            </Button>

          </Stack>

        </form>

      </Modal>

    </AppShellLayout>

  )
}
