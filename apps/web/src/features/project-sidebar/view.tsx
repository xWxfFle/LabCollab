import type { ExperimentStatus, WorkspaceNodeDto } from '@labcollab/shared'
import { useLink, useRouter } from '@argon-router/react'
import {
  ActionIcon,
  Box,
  Group,
  Menu,
  NavLink,
  ScrollArea,
  SegmentedControl,
  Select,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
} from '@mantine/core'
import { IconFileText, IconFlask, IconSettings } from '@tabler/icons-react'
import { useUnit } from 'effector-react'
import { useMemo } from 'react'
import { projectQuery, workspaceQuery, workspaceSearchQuery } from '@/shared/api'
import { experimentStatusFilterOptions } from '@/shared/lib'
import { routes } from '@/shared/routing'
import { collectExperimentTags } from './lib'
import {
  $canEdit,
  $searchQuery,
  $statusFilter,
  $tagFilter,
  $workspaceFiltersQuery,
  newExperimentClicked,
  newFolderClicked,
  newPageClicked,
  searchQueryChanged,
  statusFilterChanged,
  tagFilterChanged,
} from './model'
import { ProjectSidebarTree } from './project-sidebar-tree'
import { useMobileNavClose } from './use-mobile-nav-close'
import { treeIconProps, workspaceTreeNavLinkProps } from './workspace-tree-icons'
import { WorkspaceTreeNavLink } from './workspace-tree-nav-link'

interface ProjectSidebarProps {
  projectId: string
  activePageId: string | null
  activeExperimentId: string | null
  settingsActive?: boolean
}

export function ProjectSidebar({
  projectId,
  activePageId,
  activeExperimentId,
  settingsActive = false,
}: ProjectSidebarProps) {
  const [project, tree, searchResults, searchQuery, statusFilter, tagFilter, canEdit, workspaceFiltersQuery] = useUnit([
    projectQuery.$data,
    workspaceQuery.$data,
    workspaceSearchQuery.$data,
    $searchQuery,
    $statusFilter,
    $tagFilter,
    $canEdit,
    $workspaceFiltersQuery,
  ])

  const onSearchChange = useUnit(searchQueryChanged)
  const onStatusChange = useUnit(statusFilterChanged)
  const onTagFilterChange = useUnit(tagFilterChanged)
  const onNewFolder = useUnit(newFolderClicked)
  const onNewPage = useUnit(newPageClicked)
  const onNewExperiment = useUnit(newExperimentClicked)

  const { path: settingsPath } = useLink(routes.projectSettings, {
    projectId,
    tab: 'general',
  })
  const { onNavigate } = useRouter()
  const closeMobileNav = useMobileNavClose()

  const isSearchActive = searchQuery.trim().length > 0
  const nodes = (tree ?? []) as WorkspaceNodeDto[]
  const tagOptions = useMemo(
    () => collectExperimentTags((tree ?? []) as WorkspaceNodeDto[]),
    [tree],
  )

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
          onChange={e => onSearchChange(e.currentTarget.value)}
        />
      </Box>

      <Box px="xs">
        <SegmentedControl
          size="xs"
          fullWidth
          value={statusFilter}
          onChange={value =>
            onStatusChange(value as ExperimentStatus | 'all')}
          data={experimentStatusFilterOptions}
        />
      </Box>

      <Box px="xs">
        <Select
          size="xs"
          placeholder="Фильтр по тегу"
          clearable
          searchable
          disabled={tagOptions.length === 0}
          value={tagFilter}
          onChange={value => onTagFilterChange(value)}
          data={tagOptions}
          nothingFoundMessage="Нет тегов"
        />
      </Box>

      <ScrollArea flex={1} type="auto" offsetScrollbars>
        {isSearchActive && searchResults
          ? (
              <Stack gap={2} px={4}>
                {searchResults.pages.map(p => (
                  <WorkspaceTreeNavLink
                    key={p.id}
                    route={routes.projectPageView}
                    params={{ projectId, pageId: p.id }}
                    label={p.title}
                    leftSection={(
                      <ThemeIcon variant="light" color="gray" size={24} radius="sm">
                        <IconFileText {...treeIconProps} />
                      </ThemeIcon>
                    )}
                    active={activePageId === p.id}
                  />
                ))}
                {searchResults.experiments.map(e => (
                  <WorkspaceTreeNavLink
                    key={e.id}
                    route={routes.experimentView}
                    params={{ projectId, experimentId: e.id }}
                    label={e.title}
                    leftSection={(
                      <ThemeIcon variant="light" color="violet" size={24} radius="sm">
                        <IconFlask {...treeIconProps} />
                      </ThemeIcon>
                    )}
                    active={activeExperimentId === e.id}
                  />
                ))}
                {searchResults.pages.length === 0 && searchResults.experiments.length === 0 && (
                  <Text size="sm" c="dimmed" px="xs" py="xs">
                    Ничего не найдено
                  </Text>
                )}
              </Stack>
            )
          : (
              <ProjectSidebarTree
                projectId={projectId}
                tree={nodes}
                activePageId={activePageId}
                activeExperimentId={activeExperimentId}
              />
            )}
      </ScrollArea>

      <Box
        px="xs"
        pt="xs"
        style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}
      >
        <NavLink
          {...workspaceTreeNavLinkProps}
          href={settingsPath}
          label="Настройки проекта"
          leftSection={<IconSettings size={18} stroke={1.5} />}
          active={settingsActive}
          variant={settingsActive ? 'light' : 'subtle'}
          color="violet"
          onClick={(event) => {
            if (
              settingsActive
              || event.defaultPrevented
              || event.metaKey
              || event.altKey
              || event.ctrlKey
              || event.shiftKey
            ) {
              event.preventDefault()
              return
            }
            event.preventDefault()
            onNavigate({ path: settingsPath, query: workspaceFiltersQuery })
            closeMobileNav?.()
          }}
        />
      </Box>
    </Stack>
  )
}
