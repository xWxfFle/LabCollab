import type { ExperimentStatus, ExperimentVersionDto } from '@labcollab/shared'
import { useForm } from '@effector-reform/react'
import {
  Button,
  Group,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core'
import { useUnit } from 'effector-react'
import { memo, useMemo } from 'react'
import { ExperimentAttachmentsPanel } from '@/features/experiment-attachments'
import { ExperimentChecklist } from '@/features/experiment-checklist'
import { ExperimentTagsInput } from '@/features/experiment-tags'
import { ObservationsEditor } from '@/features/observations-editor'
import { experimentStatusLabels, experimentVersionPreview } from '@/shared/lib'
import { VersionHistoryAccordion } from '@/shared/ui/version-history'
import {
  $attachmentDraftRows,
  $canEdit,
  $checklist,
  $fieldDefinitions,
  $fieldValues,
  $isDirty,
  $isSaving,
  $observationsText,
  $tags,
  attachmentDownloadClicked,
  checklistChanged,
  currentRoute,
  exportPdfClicked,
  fieldValueChanged,
  metadataForm,
  observationsTextChanged,
  pendingAttachmentRemoved,
  pendingAttachmentsAdded,
  saveRequested,
  tagsChanged,
  versionSelected,
  versionsQuery,
} from '../model'

const statusOptions: Array<{ value: ExperimentStatus, label: string }> = [
  { value: 'draft', label: experimentStatusLabels.draft },
  { value: 'in_progress', label: experimentStatusLabels.in_progress },
  { value: 'completed_success', label: experimentStatusLabels.completed_success },
  { value: 'completed_failure', label: experimentStatusLabels.completed_failure },
]

interface ExperimentPageHeaderProps {
  title: string
}

export const ExperimentPageHeader = memo(({
  title,
}: ExperimentPageHeaderProps) => {
  const [canEdit, isSaving, isDirty] = useUnit([$canEdit, $isSaving, $isDirty])
  const exportPdf = useUnit(exportPdfClicked)
  const onSave = useUnit(saveRequested)
  const { fields } = useForm(metadataForm)
  const readOnly = !canEdit

  return (
    <Group justify="space-between" align="flex-start">
      <Title order={2}>{title}</Title>
      <Group gap="sm">
        {canEdit && (
          <Text size="sm" c={isDirty ? 'orange' : 'dimmed'}>
            {isSaving ? 'Сохранение…' : isDirty ? 'Есть несохранённые изменения' : 'Сохранено'}
          </Text>
        )}
        {readOnly && (
          <Text size="sm" c="dimmed">
            Только чтение
          </Text>
        )}
        {canEdit && (
          <Button
            onClick={() =>
              onSave({ title: fields.title.value, status: fields.status.value as ExperimentStatus })}
            loading={isSaving}
            disabled={!isDirty || isSaving}
          >
            Сохранить
          </Button>
        )}
        <Button variant="light" onClick={() => exportPdf()}>
          PDF
        </Button>
      </Group>
    </Group>
  )
})

export const ExperimentMetadataFields = memo(() => {
  const canEdit = useUnit($canEdit)
  const { fields } = useForm(metadataForm)
  const readOnly = !canEdit

  return (
    <Stack>
      <TextInput
        label="Название"
        value={fields.title.value}
        onChange={e => fields.title.onChange(e.currentTarget.value)}
        onBlur={fields.title.onBlur}
        readOnly={readOnly}
      />
      <Select
        label="Статус"
        value={fields.status.value}
        onChange={v => v && fields.status.onChange(v as ExperimentStatus)}
        data={statusOptions}
        readOnly={readOnly}
        disabled={readOnly}
      />
    </Stack>
  )
})

export const ExperimentDynamicFields = memo(() => {
  const [fieldDefinitions, fieldValues, canEdit, onFieldValueChange] = useUnit([
    $fieldDefinitions,
    $fieldValues,
    $canEdit,
    fieldValueChanged,
  ])
  const readOnly = !canEdit

  const sortedFields = useMemo(
    () => [...fieldDefinitions].sort((a, b) => a.order - b.order),
    [fieldDefinitions],
  )

  return (
    <>
      {sortedFields.map(field => (
        <Textarea
          key={field.id}
          label={field.label}
          value={fieldValues[field.id] ?? ''}
          onChange={e =>
            onFieldValueChange({ fieldId: field.id, value: e.currentTarget.value })}
          required={field.required}
          readOnly={readOnly}
          autosize
          minRows={2}
        />
      ))}
    </>
  )
})

export const ExperimentTagsSection = memo(() => {
  const [tags, canEdit, onTagsChange] = useUnit([$tags, $canEdit, tagsChanged])
  const readOnly = !canEdit

  return (
    <ExperimentTagsInput
      value={tags}
      onChange={onTagsChange}
      readOnly={readOnly}
    />
  )
})

export const ExperimentChecklistSection = memo(() => {
  const [checklist, canEdit, onChecklistChange] = useUnit([$checklist, $canEdit, checklistChanged])
  const readOnly = !canEdit

  return (
    <ExperimentChecklist
      items={checklist}
      onChange={onChecklistChange}
      readOnly={readOnly}
    />
  )
})

export const ExperimentObservationsSection = memo(() => {
  const [params, observationsText, canEdit, onObservationsChange] = useUnit([
    currentRoute.$params,
    $observationsText,
    $canEdit,
    observationsTextChanged,
  ])
  const readOnly = !canEdit

  return (
    <ObservationsEditor
      editorKey={params.experimentId}
      content={observationsText}
      onChange={onObservationsChange}
      readOnly={readOnly}
    />
  )
})

export const ExperimentAttachmentsSection = memo(() => {
  const [
    attachmentRows,
    canEdit,
    isSaving,
    onPendingAttachmentsAdded,
    onPendingAttachmentRemoved,
    onAttachmentDownload,
  ] = useUnit([
    $attachmentDraftRows,
    $canEdit,
    $isSaving,
    pendingAttachmentsAdded,
    pendingAttachmentRemoved,
    attachmentDownloadClicked,
  ])

  return (
    <ExperimentAttachmentsPanel
      rows={attachmentRows}
      canEdit={canEdit}
      isSaving={isSaving}
      onFilesAdded={onPendingAttachmentsAdded}
      onRemove={onPendingAttachmentRemoved}
      onDownload={onAttachmentDownload}
    />
  )
})

export const ExperimentVersionsSection = memo(() => {
  const [versions, onVersionSelected] = useUnit([versionsQuery.$data, versionSelected])

  const versionHistoryItems = useMemo(() => {
    const versionList = (versions ?? []) as ExperimentVersionDto[]
    return versionList.map(version => ({
      id: version.id,
      createdAt: version.createdAt,
      createdByDisplayName: version.createdByDisplayName,
      title: version.snapshot.title,
      preview: experimentVersionPreview(version.snapshot) || undefined,
    }))
  }, [versions])

  return (
    <VersionHistoryAccordion
      items={versionHistoryItems}
      emptyMessage="Версий пока нет. Сохраните эксперимент, чтобы создать версию."
      onItemSelect={(id) => {
        const versionList = (versions ?? []) as ExperimentVersionDto[]
        const version = versionList.find(item => item.id === id)
        if (version)
          onVersionSelected(version)
      }}
    />
  )
})
