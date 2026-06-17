import { Button, Modal, Stack, TextInput } from '@mantine/core'
import { useState } from 'react'

interface WorkspaceRenameModalProps {
  opened: boolean
  nodeKey: string
  initialTitle: string
  nodeLabel: string
  onClose: () => void
  onConfirm: (title: string) => void
}

function WorkspaceRenameForm({
  initialTitle,
  onConfirm,
}: {
  initialTitle: string
  onConfirm: (title: string) => void
}) {
  const [title, setTitle] = useState(initialTitle)

  return (
    <Stack>
      <TextInput
        label="Название"
        value={title}
        onChange={e => setTitle(e.currentTarget.value)}
        required
        autoFocus
      />
      <Button onClick={() => onConfirm(title.trim())} disabled={!title.trim()}>
        Сохранить
      </Button>
    </Stack>
  )
}

export function WorkspaceRenameModal({
  opened,
  nodeKey,
  initialTitle,
  nodeLabel,
  onClose,
  onConfirm,
}: WorkspaceRenameModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title={`Переименовать: ${nodeLabel}`}>
      {opened && (
        <WorkspaceRenameForm
          key={nodeKey}
          initialTitle={initialTitle}
          onConfirm={onConfirm}
        />
      )}
    </Modal>
  )
}
