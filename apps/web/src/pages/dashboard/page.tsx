import { useForm } from '@effector-reform/react'
import {
  Button,
  Container,
  Modal,
  SimpleGrid,
  Skeleton,
  Stack,
  Textarea,
  TextInput,
} from '@mantine/core'
import { useUnit } from 'effector-react'
import { AppShellLayout } from '@/layouts/app-shell'
import { $viewer } from '@/shared/viewer'
import {
  $createModalOpened,
  createFormModel,
  createModalClosed,
  createModalOpened,
  createProjectMutation,
  projectsQuery,
} from './model'
import {
  DashboardMainGrid,
  DashboardPageHeader,
} from './ui/dashboard-sections'

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

  const list = projects ?? []
  const greetingName = viewer?.displayName?.trim() || viewer?.email

  const handleCreateProject = () => openModal()

  return (
    <AppShellLayout>
      <Container size="xl" px="md">
        <Stack gap="xl">
          <DashboardPageHeader greetingName={greetingName} />

          {pending && (
            <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
              <Stack gap="md">
                <Skeleton height={140} radius="md" />
                <Skeleton height={140} radius="md" />
              </Stack>
              <Stack gap="md">
                <Skeleton height={88} radius="md" />
                <Skeleton height={88} radius="md" />
                <Skeleton height={200} radius="md" />
              </Stack>
            </SimpleGrid>
          )}

          {!pending && (
            <DashboardMainGrid
              projects={list}
              onCreateProject={handleCreateProject}
            />
          )}
        </Stack>
      </Container>

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
