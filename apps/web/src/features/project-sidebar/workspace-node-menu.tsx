import type { ProjectNodeType } from '@labcollab/shared'
import { ActionIcon, Menu } from '@mantine/core'
import { IconDotsVertical } from '@tabler/icons-react'

interface WorkspaceNodeMenuProps {
  nodeType: ProjectNodeType
  onCreateFolder: () => void
  onCreatePage: () => void
  onCreateExperiment: () => void
  onRename?: () => void
  onMove?: () => void
  onDelete: () => void
}

export function WorkspaceNodeMenu({
  nodeType,
  onCreateFolder,
  onCreatePage,
  onCreateExperiment,
  onRename,
  onMove,
  onDelete,
}: WorkspaceNodeMenuProps) {
  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <ActionIcon
          variant="subtle"
          size="sm"
          aria-label="Действия"
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
        >
          <IconDotsVertical size={14} stroke={1.5} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        {nodeType === 'folder' && (
          <>
            <Menu.Item onClick={onCreateFolder}>Создать папку</Menu.Item>
            <Menu.Item onClick={onCreatePage}>Создать страницу</Menu.Item>
            <Menu.Item onClick={onCreateExperiment}>Создать эксперимент</Menu.Item>
            <Menu.Divider />
          </>
        )}
        {onRename && (nodeType === 'folder' || nodeType === 'page') && (
          <Menu.Item onClick={onRename}>Переименовать…</Menu.Item>
        )}
        {onMove && <Menu.Item onClick={onMove}>Переместить…</Menu.Item>}
        <Menu.Item color="red" onClick={onDelete}>
          Удалить
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
