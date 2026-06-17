import type { AttachmentDraftRow } from './types'
import {
  ActionIcon,
  Badge,
  Button,
  FileButton,
  Group,
  Input,
  Paper,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core'
import { IconTrash, IconUpload } from '@tabler/icons-react'
import { useState } from 'react'
import { AttachmentFileIcon } from './attachment-file-icon'
import {
  allowedAttachmentAccept,
  allowedAttachmentHint,
  filterAllowedAttachmentFiles,
} from './lib'

interface ExperimentAttachmentsPanelProps {
  rows: AttachmentDraftRow[]
  canEdit: boolean
  isSaving: boolean
  onFilesAdded: (files: File[]) => void
  onRemove: (payload: { id: string, source: 'local' | 'server' }) => void
  onDownload: (payload: { id: string, filename: string }) => void
}

export function ExperimentAttachmentsPanel({
  rows,
  canEdit,
  isSaving,
  onFilesAdded,
  onRemove,
  onDownload,
}: ExperimentAttachmentsPanelProps) {
  const [isDragging, setIsDragging] = useState(false)

  const addFiles = (files: File[]) => {
    const allowed = filterAllowedAttachmentFiles(files)
    if (allowed.length > 0)
      onFilesAdded(allowed)
  }

  return (
    <Paper withBorder p="md">
      <Stack gap="sm">
        {canEdit
          ? (
              <Input.Wrapper
                label="Вложения"
                description={`Файлы сохраняются после нажатия «Сохранить». ${allowedAttachmentHint}`}
              >
                <Paper
                  withBorder
                  p="lg"
                  mt={4}
                  onDragEnter={(event) => {
                    event.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragOver={(event) => {
                    event.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault()
                    if (event.currentTarget.contains(event.relatedTarget as Node | null))
                      return
                    setIsDragging(false)
                  }}
                  onDrop={(event) => {
                    event.preventDefault()
                    setIsDragging(false)
                    addFiles(Array.from(event.dataTransfer.files))
                  }}
                  style={{
                    borderStyle: 'dashed',
                    borderColor: isDragging
                      ? 'var(--mantine-color-violet-5)'
                      : 'var(--mantine-color-default-border)',
                    backgroundColor: isDragging
                      ? 'var(--mantine-color-violet-0)'
                      : 'var(--mantine-color-body)',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    opacity: isSaving ? 0.6 : 1,
                    transition: 'border-color 150ms ease, background-color 150ms ease',
                  }}
                >
                  <Stack align="center" gap="xs">
                    <ThemeIcon size={40} radius="md" variant="light" color="violet">
                      <IconUpload size={22} stroke={1.5} />
                    </ThemeIcon>
                    <Text size="sm" ta="center">
                      Перетащите файлы сюда
                    </Text>
                    <Text size="xs" c="dimmed" ta="center">
                      или выберите на устройстве (можно несколько)
                    </Text>
                    <FileButton
                      onChange={(payload) => {
                        if (!payload)
                          return
                        addFiles(Array.isArray(payload) ? payload : [payload])
                      }}
                      multiple
                      accept={allowedAttachmentAccept}
                      disabled={isSaving}
                    >
                      {props => (
                        <Button {...props} variant="light" size="sm" disabled={isSaving}>
                          Выбрать файлы
                        </Button>
                      )}
                    </FileButton>
                  </Stack>
                </Paper>
              </Input.Wrapper>
            )
          : (
              <Input.Label>Вложения</Input.Label>
            )}

        {rows.length > 0 && (
          <Stack gap="xs">
            {rows.map(row => (
              <Group key={row.id} justify="space-between" wrap="nowrap">
                <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                  <AttachmentFileIcon filename={row.filename} />
                  <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                    <Group gap="xs" wrap="nowrap">
                      <Text size="sm" lineClamp={1}>
                        {row.filename}
                      </Text>
                      {row.isPending && (
                        <Badge size="xs" variant="light" color="orange">
                          не сохранён
                        </Badge>
                      )}
                    </Group>
                  </Stack>
                </Group>
                <Group gap="xs" wrap="nowrap">
                  {row.source === 'server' && (
                    <Button
                      size="xs"
                      variant="light"
                      onClick={() => onDownload({ id: row.id, filename: row.filename })}
                    >
                      Скачать
                    </Button>
                  )}
                  {canEdit && (
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      aria-label="Удалить вложение"
                      onClick={() => onRemove({ id: row.id, source: row.source })}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  )}
                </Group>
              </Group>
            ))}
          </Stack>
        )}

        {!canEdit && rows.length === 0 && (
          <Text size="sm" c="dimmed">
            Нет вложений
          </Text>
        )}
      </Stack>
    </Paper>
  )
}
