import type { WorkspaceNodeDto } from '@labcollab/shared'
import { Button, Modal, Select, Stack } from '@mantine/core'
import { useState } from 'react'
import { collectFolders, isDescendantFolder } from './lib'

interface WorkspaceMoveModalProps {
  opened: boolean
  tree: WorkspaceNodeDto[]
  nodeId: string | null
  nodeType: 'folder' | 'page' | 'experiment' | null
  onClose: () => void
  onConfirm: (parentId: string | null) => void
}

interface WorkspaceMoveFormProps {
  tree: WorkspaceNodeDto[]
  nodeId: string | null
  nodeType: 'folder' | 'page' | 'experiment' | null
  onConfirm: (parentId: string | null) => void
}

function WorkspaceMoveForm({ tree, nodeId, nodeType, onConfirm }: WorkspaceMoveFormProps) {
  const [parentId, setParentId] = useState<string | null>(null)

  const folders = collectFolders(tree).filter((folder) => {
    if (!nodeId || nodeType !== 'folder')
      return true
    if (folder.id === nodeId)
      return false
    return !isDescendantFolder(tree, nodeId, folder.id)
  })

  const data = [
    { value: '', label: 'Корень проекта' },
    ...folders.map(f => ({
      value: f.id,
      label: `${'  '.repeat(f.depth)}${f.title}`,
    })),
  ]

  return (
    <Stack>
      <Select
        label="Папка"
        data={data}
        value={parentId ?? ''}
        onChange={value => setParentId(value || null)}
      />
      <Button onClick={() => onConfirm(parentId)}>Переместить</Button>
    </Stack>
  )
}

export function WorkspaceMoveModal({
  opened,
  tree,
  nodeId,
  nodeType,
  onClose,
  onConfirm,
}: WorkspaceMoveModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="Переместить в папку">
      {opened && (
        <WorkspaceMoveForm
          key={nodeId ?? 'move'}
          tree={tree}
          nodeId={nodeId}
          nodeType={nodeType}
          onConfirm={onConfirm}
        />
      )}
    </Modal>
  )
}
