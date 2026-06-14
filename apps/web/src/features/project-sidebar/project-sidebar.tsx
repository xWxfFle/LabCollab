import type { WorkspaceNodeDto } from '@labcollab/shared';
import {
  ActionIcon,
  Box,
  Group,
  Menu,
  ScrollArea,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useUnit } from 'effector-react';
import { projectQuery, workspaceQuery, workspaceSearchQuery } from '@/shared/api';
import { RouteLink, routes } from '@/shared/routing';
import {
  $canEdit,
  $searchQuery,
  $statusFilter,
  newExperimentClicked,
  newFolderClicked,
  newPageClicked,
  searchQueryChanged,
  statusFilterChanged,
} from '@/layouts/project-workspace/model';
import { ProjectSidebarTree } from './project-sidebar-tree';

interface ProjectSidebarProps {
  projectId: string;
  activePageId: string | null;
  activeExperimentId: string | null;
}

export function ProjectSidebar({
  projectId,
  activePageId,
  activeExperimentId,
}: ProjectSidebarProps) {
  const [project, tree, searchResults, searchQuery, statusFilter, canEdit] = useUnit([
    projectQuery.$data,
    workspaceQuery.$data,
    workspaceSearchQuery.$data,
    $searchQuery,
    $statusFilter,
    $canEdit,
  ]);

  const onSearchChange = useUnit(searchQueryChanged);
  const onStatusChange = useUnit(statusFilterChanged);
  const onNewFolder = useUnit(newFolderClicked);
  const onNewPage = useUnit(newPageClicked);
  const onNewExperiment = useUnit(newExperimentClicked);

  const isSearchActive = searchQuery.trim().length > 0;
  const nodes = (tree ?? []) as WorkspaceNodeDto[];

  return (
    <Stack gap="sm" h="100%">
      <Group justify="space-between" px="xs">
        <Text fw={600} size="sm" lineClamp={2}>
          {project?.name ?? 'Проект'}
        </Text>
        {canEdit && (
          <Menu position="bottom-end" withinPortal>
            <Menu.Target>
              <ActionIcon variant="light" size="sm" aria-label="Создать">
                +
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item onClick={() => onNewFolder(null)}>Папка</Menu.Item>
              <Menu.Item onClick={() => onNewPage(null)}>Страница</Menu.Item>
              <Menu.Item onClick={() => onNewExperiment(null)}>Эксперимент</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>

      <Box px="xs">
        <TextInput
          placeholder="Поиск…"
          size="xs"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.currentTarget.value)}
        />
      </Box>

      <Box px="xs">
        <SegmentedControl
          size="xs"
          fullWidth
          value={statusFilter}
          onChange={(value) =>
            onStatusChange(value as 'all' | 'draft' | 'in_progress' | 'completed')
          }
          data={[
            { value: 'all', label: 'Все' },
            { value: 'draft', label: 'Черн.' },
            { value: 'in_progress', label: 'В раб.' },
            { value: 'completed', label: 'Готово' },
          ]}
        />
      </Box>

      <ScrollArea flex={1} type="auto" offsetScrollbars>
        {isSearchActive && searchResults ? (
          <Stack gap={4} px="xs">
            {searchResults.pages.map((p) => (
              <RouteLink
                key={p.id}
                to={routes.projectPageView}
                params={{ projectId, pageId: p.id }}
              >
                <Text size="sm">📄 {p.title}</Text>
              </RouteLink>
            ))}
            {searchResults.experiments.map((e) => (
              <RouteLink
                key={e.id}
                to={routes.experimentView}
                params={{ projectId, experimentId: e.id }}
              >
                <Text size="sm">🧪 {e.title}</Text>
              </RouteLink>
            ))}
            {searchResults.pages.length === 0 && searchResults.experiments.length === 0 && (
              <Text size="sm" c="dimmed">
                Ничего не найдено
              </Text>
            )}
          </Stack>
        ) : (
          <ProjectSidebarTree
            projectId={projectId}
            tree={nodes}
            activePageId={activePageId}
            activeExperimentId={activeExperimentId}
          />
        )}
      </ScrollArea>
    </Stack>
  );
}
