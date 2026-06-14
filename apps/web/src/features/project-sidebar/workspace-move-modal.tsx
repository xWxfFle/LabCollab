import type { WorkspaceNodeDto } from '@labcollab/shared';
import { Button, Modal, Select, Stack } from '@mantine/core';
import { useEffect, useState } from 'react';
import { collectFolders, isDescendantFolder } from './lib';

interface WorkspaceMoveModalProps {
  opened: boolean;
  tree: WorkspaceNodeDto[];
  nodeId: string | null;
  nodeType: 'folder' | 'page' | 'experiment' | null;
  onClose: () => void;
  onConfirm: (parentId: string | null) => void;
}

export function WorkspaceMoveModal({
  opened,
  tree,
  nodeId,
  nodeType,
  onClose,
  onConfirm,
}: WorkspaceMoveModalProps) {
  const [parentId, setParentId] = useState<string | null>(null);

  useEffect(() => {
    if (opened) setParentId(null);
  }, [opened, nodeId]);

  const folders = collectFolders(tree).filter((folder) => {
    if (!nodeId || nodeType !== 'folder') return true;
    if (folder.id === nodeId) return false;
    return !isDescendantFolder(tree, nodeId, folder.id);
  });

  const data = [
    { value: '', label: 'Корень проекта' },
    ...folders.map((f) => ({
      value: f.id,
      label: `${'  '.repeat(f.depth)}${f.title}`,
    })),
  ];

  return (
    <Modal opened={opened} onClose={onClose} title="Переместить в папку">
      <Stack>
        <Select
          label="Папка"
          data={data}
          value={parentId ?? ''}
          onChange={(value) => setParentId(value ? value : null)}
        />
        <Button onClick={() => onConfirm(parentId)}>Переместить</Button>
      </Stack>
    </Modal>
  );
}
