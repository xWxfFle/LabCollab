import type { ProjectNodeType } from '@labcollab/shared';
import { ActionIcon, Menu } from '@mantine/core';

interface WorkspaceNodeMenuProps {
  nodeType: ProjectNodeType;
  onCreateFolder: () => void;
  onCreatePage: () => void;
  onCreateExperiment: () => void;
  onMove?: () => void;
  onDelete: () => void;
}

export function WorkspaceNodeMenu({
  nodeType,
  onCreateFolder,
  onCreatePage,
  onCreateExperiment,
  onMove,
  onDelete,
}: WorkspaceNodeMenuProps) {
  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <ActionIcon
          variant="subtle"
          size="xs"
          aria-label="Действия"
          onClick={(e) => e.stopPropagation()}
        >
          ⋯
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
        {onMove && <Menu.Item onClick={onMove}>Переместить…</Menu.Item>}
        <Menu.Item color="red" onClick={onDelete}>
          Удалить
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
