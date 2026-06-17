import type { ProjectNodeType, WorkspaceNodeDto } from '@labcollab/shared'
import { Badge, Box, Collapse, Group, NavLink, Stack, Text, ThemeIcon } from '@mantine/core'
import {
  IconChevronRight,
  IconFileText,
  IconFlask,
  IconFolder,
} from '@tabler/icons-react'
import { useUnit } from 'effector-react'
import { useState } from 'react'
import { confirmAction, experimentStatusMeta, experimentStatusShortLabels } from '@/shared/lib'
import { routes } from '@/shared/routing'
import {
  filterWorkspaceTree,
  readCollapsedFolders,
  writeCollapsedFolders,
} from './lib'
import {
  $canEdit,
  $statusFilter,
  $tagFilter,
  newExperimentClicked,
  newFolderClicked,
  newPageClicked,
  nodeDeleteClicked,
  nodeMoveClicked,
  nodeRenameClicked,
} from './model'
import { WorkspaceNodeMenu } from './workspace-node-menu'
import { treeIconProps, workspaceTreeNavLinkProps } from './workspace-tree-icons'
import { WorkspaceTreeNavLink } from './workspace-tree-nav-link'

function confirmDelete(node: WorkspaceNodeDto): boolean {
  if (node.type === 'folder') {
    return confirmAction(
      'Удалить папку? Папку можно удалить только если она пуста.',
    )
  }
  if (node.type === 'page') {
    return confirmAction('Удалить страницу? Это действие нельзя отменить.')
  }
  return confirmAction('Удалить эксперимент? Это действие нельзя отменить.')
}

function nodeLeftSection(type: WorkspaceNodeDto['type']) {
  const color = type === 'folder' ? 'yellow' : type === 'page' ? 'gray' : 'violet'

  const Icon = type === 'folder'
    ? IconFolder
    : type === 'page'
      ? IconFileText
      : IconFlask

  return (
    <ThemeIcon variant="light" color={color} size={24} radius="sm">
      <Icon {...treeIconProps} />
    </ThemeIcon>
  )
}

function FolderChevron({ opened }: { opened: boolean }) {
  return (
    <IconChevronRight
      {...treeIconProps}
      size={14}
      style={{
        transition: 'transform 150ms ease',
        transform: opened ? 'rotate(90deg)' : undefined,
        opacity: 0.55,
      }}
    />
  )
}

interface TreeNodeProps {
  node: WorkspaceNodeDto
  projectId: string
  activePageId: string | null
  activeExperimentId: string | null
  collapsed: Set<string>
  canEdit: boolean
  onFolderOpen: (folderId: string, opened: boolean) => void
  onNewFolder: (parentId: string | null) => void
  onNewPage: (parentId: string | null) => void
  onNewExperiment: (parentId: string | null) => void
  onDelete: (payload: {
    nodeId: string
    type: ProjectNodeType
    experimentId?: string | null
    pageId?: string | null
  }) => void
  onMove: (payload: { nodeId: string, type: ProjectNodeType }) => void
  onRename: (payload: {
    nodeId: string
    type: ProjectNodeType
    title: string
    pageId?: string | null
  }) => void
}

function TreeNode({
  node,
  projectId,
  activePageId,
  activeExperimentId,
  collapsed,
  canEdit,
  onFolderOpen,
  onNewFolder,
  onNewPage,
  onNewExperiment,
  onDelete,
  onMove,
  onRename,
}: TreeNodeProps) {
  const folderParentId = node.type === 'folder' ? node.id : null

  const menu = canEdit
    ? (
        <WorkspaceNodeMenu
          nodeType={node.type}
          onCreateFolder={() => onNewFolder(folderParentId)}
          onCreatePage={() => onNewPage(folderParentId)}
          onCreateExperiment={() => onNewExperiment(folderParentId)}
          onRename={
            node.type === 'folder' || node.type === 'page'
              ? () =>
                  onRename({
                    nodeId: node.id,
                    type: node.type,
                    title: node.title,
                    pageId: node.pageId,
                  })
              : undefined
          }
          onMove={() => onMove({ nodeId: node.id, type: node.type })}
          onDelete={() => {
            if (!confirmDelete(node))
              return
            onDelete({
              nodeId: node.id,
              type: node.type,
              experimentId: node.experimentId,
              pageId: node.pageId,
            })
          }}
        />
      )
    : null

  if (node.type === 'folder') {
    const opened = !collapsed.has(node.id)

    return (
      <Stack gap={2}>
        <Box
          style={{
            display: 'flex',
            alignItems: 'stretch',
            width: '100%',
          }}
        >
          <NavLink
            {...workspaceTreeNavLinkProps}
            component="button"
            type="button"
            label={node.title}
            leftSection={nodeLeftSection('folder')}
            rightSection={<FolderChevron opened={opened} />}
            variant="subtle"
            noWrap
            disableRightSectionRotation
            onClick={() => onFolderOpen(node.id, !opened)}
            style={{ flex: 1, minWidth: 0 }}
          />
          {menu && (
            <Box
              style={{
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
                paddingRight: 'var(--mantine-spacing-xs)',
              }}
            >
              {menu}
            </Box>
          )}
        </Box>
        <Collapse expanded={opened}>
          <Stack gap={2} pl="md">
            {node.children.map(child => (
              <TreeNode
                key={child.id}
                node={child}
                projectId={projectId}
                activePageId={activePageId}
                activeExperimentId={activeExperimentId}
                collapsed={collapsed}
                canEdit={canEdit}
                onFolderOpen={onFolderOpen}
                onNewFolder={onNewFolder}
                onNewPage={onNewPage}
                onNewExperiment={onNewExperiment}
                onDelete={onDelete}
                onMove={onMove}
                onRename={onRename}
              />
            ))}
          </Stack>
        </Collapse>
      </Stack>
    )
  }

  if (node.type === 'page' && node.pageId) {
    return (
      <WorkspaceTreeNavLink
        route={routes.projectPageView}
        params={{ projectId, pageId: node.pageId }}
        label={node.title}
        leftSection={nodeLeftSection('page')}
        rightSection={menu}
        active={activePageId === node.pageId}
      />
    )
  }

  if (node.type === 'experiment' && node.experimentId) {
    const status = node.experimentStatus
    const statusMeta = status ? experimentStatusMeta[status] : null

    return (
      <WorkspaceTreeNavLink
        route={routes.experimentView}
        params={{ projectId, experimentId: node.experimentId }}
        label={(
          <Group gap={6} wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
            <Text component="span" size="sm" truncate>
              {node.title}
            </Text>
            {statusMeta && (
              <Badge
                size="xs"
                variant="light"
                color={statusMeta.color}
                style={{ flexShrink: 0 }}
              >
                {experimentStatusShortLabels[status!]}
              </Badge>
            )}
          </Group>
        )}
        leftSection={nodeLeftSection('experiment')}
        rightSection={menu}
        active={activeExperimentId === node.experimentId}
      />
    )
  }

  return null
}

interface ProjectSidebarTreeProps {
  projectId: string
  tree: WorkspaceNodeDto[]
  activePageId: string | null
  activeExperimentId: string | null
}

export function ProjectSidebarTree({
  projectId,
  tree,
  activePageId,
  activeExperimentId,
}: ProjectSidebarTreeProps) {
  const [statusFilter, tagFilter, canEdit] = useUnit([$statusFilter, $tagFilter, $canEdit])
  const [
    onNewFolder,
    onNewPage,
    onNewExperiment,
    onDelete,
    onMove,
    onRename,
  ] = useUnit([
    newFolderClicked,
    newPageClicked,
    newExperimentClicked,
    nodeDeleteClicked,
    nodeMoveClicked,
    nodeRenameClicked,
  ])

  const [collapsed, setCollapsed] = useState(() => readCollapsedFolders(projectId))

  const onFolderOpen = (folderId: string, opened: boolean) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (opened)
        next.delete(folderId)
      else next.add(folderId)
      writeCollapsedFolders(projectId, next)
      return next
    })
  }

  const filtered = filterWorkspaceTree(tree, statusFilter, tagFilter)

  if (filtered.length === 0) {
    return (
      <Text size="sm" c="dimmed" px="sm" py="xs">
        Нет элементов
      </Text>
    )
  }

  return (
    <Stack gap={2} px={4}>
      {filtered.map(node => (
        <TreeNode
          key={node.id}
          node={node}
          projectId={projectId}
          activePageId={activePageId}
          activeExperimentId={activeExperimentId}
          collapsed={collapsed}
          canEdit={canEdit}
          onFolderOpen={onFolderOpen}
          onNewFolder={onNewFolder}
          onNewPage={onNewPage}
          onNewExperiment={onNewExperiment}
          onDelete={onDelete}
          onMove={onMove}
          onRename={onRename}
        />
      ))}
    </Stack>
  )
}
