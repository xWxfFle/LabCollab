import type { ExperimentStatus, ProjectNodeType, WorkspaceNodeDto } from '@labcollab/shared'
import { Badge, Group, NavLink, Stack, Text, ThemeIcon } from '@mantine/core'
import {
  IconChevronRight,
  IconFileText,
  IconFlask,
  IconFolder,
} from '@tabler/icons-react'
import { useUnit } from 'effector-react'
import { useState } from 'react'
import { confirmAction, experimentStatusMeta } from '@/shared/lib'
import { routes } from '@/shared/routing'
import {
  filterWorkspaceTree,
  readCollapsedFolders,
  writeCollapsedFolders,
} from './lib'
import {
  $canEdit,
  $statusFilter,
  newExperimentClicked,
  newFolderClicked,
  newPageClicked,
  nodeDeleteClicked,
  nodeMoveClicked,
} from './model'
import { WorkspaceNodeMenu } from './workspace-node-menu'
import { treeIconProps, workspaceTreeNavLinkProps } from './workspace-tree-icons'
import { WorkspaceTreeNavLink } from './workspace-tree-nav-link'

const experimentStatusShort: Record<ExperimentStatus, string> = {
  draft: 'Черн.',
  in_progress: 'В раб.',
  completed: 'Готово',
}

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
}: TreeNodeProps) {
  const folderParentId = node.type === 'folder' ? node.id : null

  const menu = canEdit
    ? (
        <WorkspaceNodeMenu
          nodeType={node.type}
          onCreateFolder={() => onNewFolder(folderParentId)}
          onCreatePage={() => onNewPage(folderParentId)}
          onCreateExperiment={() => onNewExperiment(folderParentId)}
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
      <NavLink
        {...workspaceTreeNavLinkProps}
        label={node.title}
        leftSection={nodeLeftSection('folder')}
        rightSection={(
          <Group gap={2} wrap="nowrap">
            {menu}
            <FolderChevron opened={opened} />
          </Group>
        )}
        opened={opened}
        onChange={value => onFolderOpen(node.id, value)}
        variant="subtle"
        noWrap
        childrenOffset="md"
        disableRightSectionRotation
      >
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
          />
        ))}
      </NavLink>
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
                {experimentStatusShort[status!]}
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
  const [statusFilter, canEdit] = useUnit([$statusFilter, $canEdit])
  const [
    onNewFolder,
    onNewPage,
    onNewExperiment,
    onDelete,
    onMove,
  ] = useUnit([
    newFolderClicked,
    newPageClicked,
    newExperimentClicked,
    nodeDeleteClicked,
    nodeMoveClicked,
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

  const filtered = filterWorkspaceTree(tree, statusFilter)

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
        />
      ))}
    </Stack>
  )
}
