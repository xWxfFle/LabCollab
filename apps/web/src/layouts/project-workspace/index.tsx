import type { ReactNode } from 'react'
import {
  AppShell,
  Box,
  Burger,
  Group,
  Modal,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useUnit } from 'effector-react'
import {
  $createExperimentModalOpened,
  $moveModalOpened,
  $moveTarget,
  $projectId,
  $renameModalOpened,
  $renameTarget,
  CreateExperimentModal,
  createExperimentModalClosed,
  MobileNavCloseProvider,
  nodeMoveConfirmed,
  nodeMoveModalClosed,
  nodeRenameConfirmed,
  nodeRenameModalClosed,
  ProjectSidebar,
  WorkspaceMoveModal,
  WorkspaceRenameModal,
} from '@/features/project-sidebar'
import { workspaceQuery } from '@/shared/api'
import { AppBrand, UserMenu } from '@/shared/ui/app-shell'
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
    renameModalOpened,
    renameTarget,
    tree,
  ] = useUnit([
    $projectId,
    $createExperimentModalOpened,
    $moveModalOpened,
    $moveTarget,
    $renameModalOpened,
    $renameTarget,
    workspaceQuery.$data,
  ])

  const closeCreateModal = useUnit(createExperimentModalClosed)
  const closeMoveModal = useUnit(nodeMoveModalClosed)
  const closeRenameModal = useUnit(nodeRenameModalClosed)
  const confirmMove = useUnit(nodeMoveConfirmed)
  const confirmRename = useUnit(nodeRenameConfirmed)

  const [mobileNavOpened, { toggle: toggleMobileNav, close: closeMobileNav }] = useDisclosure()

  const showLoader = loading

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{
        width: 280,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileNavOpened },
      }}
      padding="md"
    >
      <AppShell.Header px="md">
        <Group h="100%" justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
            <Burger
              opened={mobileNavOpened}
              onClick={toggleMobileNav}
              hiddenFrom="sm"
              size="sm"
              aria-label="Меню проекта"
            />
            <AppBrand compact />
          </Group>
          <UserMenu />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        {projectId
          ? (
              <MobileNavCloseProvider onClose={closeMobileNav}>
                <ProjectSidebar
                  projectId={projectId}
                  activePageId={activePageId}
                  activeExperimentId={activeExperimentId}
                  settingsActive={settingsActive}
                />
              </MobileNavCloseProvider>
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
        <CreateExperimentModal onClose={() => closeCreateModal()} />
      </Modal>

      <WorkspaceMoveModal
        opened={moveModalOpened}
        tree={(tree ?? []) as import('@labcollab/shared').WorkspaceNodeDto[]}
        nodeId={moveTarget?.nodeId ?? null}
        nodeType={moveTarget?.type ?? null}
        onClose={() => closeMoveModal()}
        onConfirm={parentId => confirmMove(parentId)}
      />

      <WorkspaceRenameModal
        opened={renameModalOpened}
        nodeKey={renameTarget?.nodeId ?? 'rename'}
        initialTitle={renameTarget?.title ?? ''}
        nodeLabel={renameTarget?.title ?? ''}
        onClose={() => closeRenameModal()}
        onConfirm={title => confirmRename(title)}
      />
    </AppShell>
  )
}
