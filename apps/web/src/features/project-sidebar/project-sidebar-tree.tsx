import type { ProjectNodeType, WorkspaceNodeDto } from '@labcollab/shared';
import { Badge, Box, Collapse, Group, NavLink, Text } from '@mantine/core';
import { useUnit } from 'effector-react';
import { useState } from 'react';
import {
  $canEdit,
  $statusFilter,
  newExperimentClicked,
  newFolderClicked,
  newPageClicked,
  nodeDeleteClicked,
  nodeMoveClicked,
} from '@/layouts/project-workspace/model';
import { RouteLink, routes } from '@/shared/routing';
import {
  filterWorkspaceTree,
  readCollapsedFolders,
  writeCollapsedFolders,
} from './lib';
import { WorkspaceNodeMenu } from './workspace-node-menu';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  in_progress: 'В процессе',
  completed: 'Завершён',
};

function confirmDelete(node: WorkspaceNodeDto): boolean {
  if (node.type === 'folder') {
    return window.confirm(
      'Удалить папку? Папку можно удалить только если она пуста.',
    );
  }
  if (node.type === 'page') {
    return window.confirm('Удалить страницу? Это действие нельзя отменить.');
  }
  return window.confirm('Удалить эксперимент? Это действие нельзя отменить.');
}

interface TreeNodeProps {
  node: WorkspaceNodeDto;
  projectId: string;
  depth: number;
  activePageId: string | null;
  activeExperimentId: string | null;
  collapsed: Set<string>;
  canEdit: boolean;
  onToggle: (folderId: string) => void;
  onNewFolder: (parentId: string | null) => void;
  onNewPage: (parentId: string | null) => void;
  onNewExperiment: (parentId: string | null) => void;
  onDelete: (payload: {
    nodeId: string;
    type: ProjectNodeType;
    experimentId?: string | null;
    pageId?: string | null;
  }) => void;
  onMove: (payload: { nodeId: string; type: ProjectNodeType }) => void;
}

function TreeNode({
  node,
  projectId,
  depth,
  activePageId,
  activeExperimentId,
  collapsed,
  canEdit,
  onToggle,
  onNewFolder,
  onNewPage,
  onNewExperiment,
  onDelete,
  onMove,
}: TreeNodeProps) {
  const paddingLeft = depth * 12;

  const menu = canEdit ? (
    <WorkspaceNodeMenu
      nodeType={node.type}
      onCreateFolder={() => onNewFolder(node.type === 'folder' ? node.id : null)}
      onCreatePage={() => onNewPage(node.type === 'folder' ? node.id : null)}
      onCreateExperiment={() => onNewExperiment(node.type === 'folder' ? node.id : null)}
      onMove={() => onMove({ nodeId: node.id, type: node.type })}
      onDelete={() => {
        if (!confirmDelete(node)) return;
        onDelete({
          nodeId: node.id,
          type: node.type,
          experimentId: node.experimentId,
          pageId: node.pageId,
        });
      }}
    />
  ) : null;

  if (node.type === 'folder') {
    const opened = !collapsed.has(node.id);
    return (
      <Box>
        <NavLink
          label={node.title}
          leftSection="📁"
          pl={paddingLeft}
          onClick={() => onToggle(node.id)}
          rightSection={
            <Group gap={4} wrap="nowrap">
              {menu}
              <Text size="xs" c="dimmed">
                {opened ? '▾' : '▸'}
              </Text>
            </Group>
          }
        />
        <Collapse expanded={opened}>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              projectId={projectId}
              depth={depth + 1}
              activePageId={activePageId}
              activeExperimentId={activeExperimentId}
              collapsed={collapsed}
              canEdit={canEdit}
              onToggle={onToggle}
              onNewFolder={onNewFolder}
              onNewPage={onNewPage}
              onNewExperiment={onNewExperiment}
              onDelete={onDelete}
              onMove={onMove}
            />
          ))}
        </Collapse>
      </Box>
    );
  }

  if (node.type === 'page' && node.pageId) {
    const active = activePageId === node.pageId;
    return (
      <Group gap={4} wrap="nowrap" pl={paddingLeft} align="center">
        <Box style={{ flex: 1, minWidth: 0 }}>
          <RouteLink
            to={routes.projectPageView}
            params={{ projectId, pageId: node.pageId }}
          >
            <NavLink
              component="div"
              label={node.title}
              leftSection="📄"
              active={active}
            />
          </RouteLink>
        </Box>
        {menu}
      </Group>
    );
  }

  if (node.type === 'experiment' && node.experimentId) {
    const active = activeExperimentId === node.experimentId;
    return (
      <Group gap={4} wrap="nowrap" pl={paddingLeft} align="center">
        <Box style={{ flex: 1, minWidth: 0 }}>
          <RouteLink
            to={routes.experimentView}
            params={{ projectId, experimentId: node.experimentId }}
          >
            <NavLink
              component="div"
              label={
                <Group gap={6} wrap="nowrap">
                  <Text size="sm" lineClamp={1}>
                    {node.title}
                  </Text>
                  {node.experimentStatus && (
                    <Badge size="xs" variant="light">
                      {STATUS_LABELS[node.experimentStatus] ?? node.experimentStatus}
                    </Badge>
                  )}
                </Group>
              }
              leftSection="🧪"
              active={active}
            />
          </RouteLink>
        </Box>
        {menu}
      </Group>
    );
  }

  return null;
}

interface ProjectSidebarTreeProps {
  projectId: string;
  tree: WorkspaceNodeDto[];
  activePageId: string | null;
  activeExperimentId: string | null;
}

export function ProjectSidebarTree({
  projectId,
  tree,
  activePageId,
  activeExperimentId,
}: ProjectSidebarTreeProps) {
  const [statusFilter, canEdit] = useUnit([$statusFilter, $canEdit]);
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
  ]);

  const [collapsed, setCollapsed] = useState(() => readCollapsedFolders(projectId));

  const onToggle = (folderId: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      writeCollapsedFolders(projectId, next);
      return next;
    });
  };

  const filtered = filterWorkspaceTree(tree, statusFilter);

  if (filtered.length === 0) {
    return (
      <Text size="sm" c="dimmed" px="sm">
        Нет элементов
      </Text>
    );
  }

  return (
    <Box>
      {filtered.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          projectId={projectId}
          depth={0}
          activePageId={activePageId}
          activeExperimentId={activeExperimentId}
          collapsed={collapsed}
          canEdit={canEdit}
          onToggle={onToggle}
          onNewFolder={onNewFolder}
          onNewPage={onNewPage}
          onNewExperiment={onNewExperiment}
          onDelete={onDelete}
          onMove={onMove}
        />
      ))}
    </Box>
  );
}
