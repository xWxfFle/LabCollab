import type { ProjectPageVersionDto } from '@labcollab/shared'
import {
  Button,
  Group,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useUnit } from 'effector-react'
import { memo, useMemo } from 'react'
import { DocPageEditor } from '@/features/doc-page-editor'
import { pageVersionsQuery } from '@/shared/api'
import { stripHtml } from '@/shared/lib'
import { VersionHistoryAccordion } from '@/shared/ui/version-history'
import {
  $bodyHtml,
  $canEdit,
  $isDirty,
  $isSaving,
  $title,
  bodyChanged,
  exportMdClicked,
  exportPdfClicked,
  saveRequested,
  titleChanged,
  versionSelected,
} from '../model'

export const ProjectPageHeader = memo(() => {
  const [title, canEdit, isSaving, isDirty] = useUnit([
    $title,
    $canEdit,
    $isSaving,
    $isDirty,
  ])
  const onTitleChange = useUnit(titleChanged)
  const onSave = useUnit(saveRequested)
  const onExportPdf = useUnit(exportPdfClicked)
  const onExportMd = useUnit(exportMdClicked)
  const readOnly = !canEdit

  return (
    <Group justify="space-between" align="flex-start">
      <Title order={2} style={{ flex: 1 }}>
        {readOnly
          ? title
          : (
              <TextInput
                variant="unstyled"
                size="xl"
                fw={700}
                value={title}
                onChange={e => onTitleChange(e.currentTarget.value)}
              />
            )}
      </Title>
      <Group gap="sm">
        {canEdit && (
          <Text size="sm" c={isDirty ? 'orange' : 'dimmed'}>
            {isSaving ? 'Сохранение…' : isDirty ? 'Есть несохранённые изменения' : 'Сохранено'}
          </Text>
        )}
        {canEdit && (
          <Button
            onClick={() => onSave()}
            loading={isSaving}
            disabled={!isDirty || isSaving}
          >
            Сохранить
          </Button>
        )}
        {readOnly && (
          <Text size="sm" c="dimmed">
            Только чтение
          </Text>
        )}
        <Button variant="light" size="xs" onClick={() => onExportPdf()}>
          PDF
        </Button>
        <Button variant="light" size="xs" onClick={() => onExportMd()}>
          Markdown
        </Button>
      </Group>
    </Group>
  )
})

interface ProjectPageBodyEditorProps {
  pageId: string
  pageUpdatedAt: string
  projectId: string
}

export const ProjectPageBodyEditor = memo(({
  pageId,
  pageUpdatedAt,
  projectId,
}: ProjectPageBodyEditorProps) => {
  const [bodyHtml, canEdit, onBodyChange] = useUnit([$bodyHtml, $canEdit, bodyChanged])
  const readOnly = !canEdit

  return (
    <DocPageEditor
      editorKey={`${pageId}-${pageUpdatedAt}`}
      content={bodyHtml}
      projectId={projectId}
      onChange={onBodyChange}
      readOnly={readOnly}
    />
  )
})

export const ProjectPageVersionsSection = memo(() => {
  const [versions, onVersionSelected] = useUnit([pageVersionsQuery.$data, versionSelected])

  const versionHistoryItems = useMemo(() => {
    const versionList = (versions ?? []) as ProjectPageVersionDto[]
    return versionList.map(version => ({
      id: version.id,
      createdAt: version.createdAt,
      createdByDisplayName: version.createdByDisplayName,
      title: version.snapshot.title,
      preview: stripHtml(version.snapshot.bodyHtml) || undefined,
    }))
  }, [versions])

  return (
    <VersionHistoryAccordion
      items={versionHistoryItems}
      emptyMessage="Версий пока нет — они создаются при сохранении изменений"
      onItemSelect={(id) => {
        const versionList = (versions ?? []) as ProjectPageVersionDto[]
        const version = versionList.find(item => item.id === id)
        if (version)
          onVersionSelected(version)
      }}
    />
  )
})
