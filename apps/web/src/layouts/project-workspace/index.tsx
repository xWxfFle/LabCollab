import type { WorkspaceNodeDto } from '@labcollab/shared'
import type { ReactNode } from 'react'
import { useForm } from '@effector-reform/react'
import {
  AppShell,
  Box,
  Button,
  Group,
  Modal,
  Stack,
  TextInput,
} from '@mantine/core'
import { useUnit } from 'effector-react'
import {
  $createExperimentModalOpened,
  $moveModalOpened,
  $moveTarget,
  $projectId,
  createExperimentForm,
  createExperimentModalClosed,
  nodeMoveConfirmed,
  nodeMoveModalClosed,
  ProjectSidebar,
  WorkspaceMoveModal,
} from '@/features/project-sidebar'
import { workspaceQuery } from '@/shared/api'
import { routes, RouteTextLink } from '@/shared/routing'
import { UserMenu } from '@/shared/ui/app-shell'
import { WorkspaceAreaLoader } from '@/shared/ui/placeholders'

interface ProjectWorkspaceLayoutProps {
  children?: ReactNode
  activePageId?: string | null
  activeExperimentId?: string | null
  settingsActive?: boolean
  loading?: boolean
  loadingLabel?: string
}

export function ProjectWorkspaceLayout({
  children,
  activePageId = null,
  activeExperimentId = null,
  settingsActive = false,
  loading = false,
  loadingLabel,
}: ProjectWorkspaceLayoutProps) {
  const [
    projectId,
    createModalOpened,
    moveModalOpened,
    moveTarget,
    tree,
  ] = useUnit([
    $projectId,
    $createExperimentModalOpened,
    $moveModalOpened,
    $moveTarget,
    workspaceQuery.$data,
  ])

  const closeCreateModal = useUnit(createExperimentModalClosed)
  const closeMoveModal = useUnit(nodeMoveModalClosed)
  const confirmMove = useUnit(nodeMoveConfirmed)
  const { fields: createFields, onSubmit: onCreateSubmit } = useForm(createExperimentForm)

  // Лоадер только по явному loading — projectId держится при переходах внутри проекта.
  const showLoader = loading

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 280, breakpoint: 'sm' }}
      padding="md"
    >
      <AppShell.Header px="md">
        <Group h="100%" justify="space-between" wrap="nowrap">
          <RouteTextLink to={routes.dashboard} c="violet">
            ← Проекты
          </RouteTextLink>
          <UserMenu />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        {projectId
          ? (
              <ProjectSidebar
                projectId={projectId}
                activePageId={activePageId}
                activeExperimentId={activeExperimentId}
                settingsActive={settingsActive}
              />
            )
          : <Box />}
      </AppShell.Navbar>

      <AppShell.Main
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        {showLoader
          ? <WorkspaceAreaLoader label={loadingLabel} />
          : children}
      </AppShell.Main>

      <Modal
        opened={createModalOpened}
        onClose={() => closeCreateModal()}
        title="Новый эксперимент"
      >
        <form onSubmit={onCreateSubmit}>
          <Stack>
            <TextInput
              label="Название"
              required
              value={createFields.title.value}
              onChange={e => createFields.title.onChange(e.currentTarget.value)}
              onBlur={createFields.title.onBlur}
            />
            <TextInput
              label="Цель"
              required
              value={createFields.objective.value}
              onChange={e => createFields.objective.onChange(e.currentTarget.value)}
              onBlur={createFields.objective.onBlur}
            />
            <Button type="submit">Создать</Button>
          </Stack>
        </form>
      </Modal>

      <WorkspaceMoveModal
        opened={moveModalOpened}
        tree={(tree ?? []) as WorkspaceNodeDto[]}
        nodeId={moveTarget?.nodeId ?? null}
        nodeType={moveTarget?.type ?? null}
        onClose={() => closeMoveModal()}
        onConfirm={parentId => confirmMove(parentId)}
      />
    </AppShell>
  )
}
