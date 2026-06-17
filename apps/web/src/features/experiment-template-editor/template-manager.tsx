import type {
  ExperimentFieldDefinition,
  ExperimentTemplateDto,
} from '@labcollab/shared'
import type { TemplateEditorScope } from './model'
import { defaultExperimentTemplateSeed } from '@labcollab/shared'
import {
  Button,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { IconPencil, IconPlus } from '@tabler/icons-react'
import { useUnit } from 'effector-react'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import {
  copyUserExperimentTemplateToProjectMutation,
  createProjectExperimentTemplateMutation,
  createUserExperimentTemplateMutation,
  deleteExperimentTemplateMutation,
  projectExperimentTemplatesQuery,
  updateExperimentTemplateMutation,
  userExperimentTemplatesQuery,
} from '@/shared/api'
import { confirmAction } from '@/shared/lib'
import { templatesForScope } from './lib'
import {
  $selectedTemplateId,
  templateCreateRequested,
  templateDeleteRequested,
  templateSaveRequested,
  templateSelected,
  userTemplateCopyToProjectRequested,
} from './model'
import {
  emptyTemplateDraft,
  templateToDraft,
} from './template-draft'
import { TemplateEditorForm } from './template-editor-form'
import { TemplatePreview } from './template-preview'

const PersonalTemplatesCopyPanel = memo(({
  canEdit,
  projectId,
  userPending,
  personalTemplates,
  copyPending,
  onCopy,
}: {
  canEdit: boolean
  projectId?: string
  userPending: boolean
  personalTemplates: ExperimentTemplateDto[]
  copyPending: boolean
  onCopy: (sourceTemplateId: string) => void
}) => {
  if (!canEdit)
    return null

  return (
    <Paper withBorder p="md">
      <Stack gap="sm">
        <Text size="sm" fw={500}>
          Скопировать личный шаблон в проект
        </Text>
        <Text size="xs" c="dimmed">
          Личные шаблоны видны только вам. После копирования шаблон появится в списке проекта
          и станет доступен всем участникам с правом редактирования.
        </Text>
        {userPending && (
          <Text size="sm" c="dimmed">
            Загрузка личных шаблонов…
          </Text>
        )}
        {!userPending && personalTemplates.length === 0 && (
          <Text size="sm" c="dimmed">
            Личных шаблонов пока нет — создайте их на главной странице в блоке «Мои шаблоны
            экспериментов».
          </Text>
        )}
        {!userPending && personalTemplates.map(template => (
          <Group key={template.id} justify="space-between" align="center" wrap="nowrap">
            <Text size="sm">{template.name}</Text>
            <Button
              variant="light"
              size="xs"
              loading={copyPending}
              disabled={!projectId}
              onClick={() => onCopy(template.id)}
            >
              Скопировать
            </Button>
          </Group>
        ))}
      </Stack>
    </Paper>
  )
})

const TemplatePicker = memo(({
  templates,
  selectedId,
  creating,
  onSelect,
  onDeselect,
  orientation = 'horizontal',
}: {
  templates: ExperimentTemplateDto[]
  selectedId: string | null
  creating: boolean
  onSelect: (template: ExperimentTemplateDto) => void
  onDeselect: () => void
  orientation?: 'horizontal' | 'vertical'
}) => {
  if (templates.length === 0)
    return null

  const buttons = templates.map(template => (
    <Button
      key={template.id}
      variant={selectedId === template.id && !creating ? 'filled' : 'light'}
      size="compact-sm"
      fullWidth={orientation === 'vertical'}
      justify={orientation === 'vertical' ? 'flex-start' : 'center'}
      onClick={() => {
        if (selectedId === template.id && !creating)
          onDeselect()
        else
          onSelect(template)
      }}
    >
      {template.name}
    </Button>
  ))

  if (orientation === 'vertical')
    return <Stack gap="xs">{buttons}</Stack>

  return <Group gap="xs">{buttons}</Group>
})

interface ExperimentTemplateManagerProps {
  scope: TemplateEditorScope
  projectId?: string
  canEdit?: boolean
  title?: string
  variant?: 'default' | 'sidebar'
}

export function ExperimentTemplateManager({
  scope,
  projectId,
  canEdit = true,
  title = 'Шаблоны экспериментов',
  variant = 'default',
}: ExperimentTemplateManagerProps) {
  const [
    userTemplates,
    projectTemplates,
    selectedId,
    userPending,
    projectPending,
    savePending,
    deletePending,
    copyPending,
  ] = useUnit([
    userExperimentTemplatesQuery.$data,
    projectExperimentTemplatesQuery.$data,
    $selectedTemplateId,
    userExperimentTemplatesQuery.$pending,
    projectExperimentTemplatesQuery.$pending,
    updateExperimentTemplateMutation.$pending,
    deleteExperimentTemplateMutation.$pending,
    copyUserExperimentTemplateToProjectMutation.$pending,
  ])

  const select = useUnit(templateSelected)
  const createNew = useUnit(templateCreateRequested)
  const save = useUnit(templateSaveRequested)
  const remove = useUnit(templateDeleteRequested)
  const copyToProject = useUnit(userTemplateCopyToProjectRequested)

  const templates = useMemo(
    () => templatesForScope(scope, userTemplates, projectTemplates),
    [scope, userTemplates, projectTemplates],
  )

  const selected = templates.find(t => t.id === selectedId) ?? null

  const [draft, setDraft] = useState(emptyTemplateDraft)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(false)
  const [savedTemplate, setSavedTemplate] = useState<ExperimentTemplateDto | null>(null)

  const previewTemplate = selected ?? savedTemplate
  const observationsEditorKey = creating
    ? 'template-draft-new'
    : `template-draft-${selectedId ?? previewTemplate?.id ?? 'none'}`

  useEffect(() => {
    const onSaveSuccess = ({ result }: { result: ExperimentTemplateDto }) => {
      setCreating(false)
      setEditing(false)
      setSavedTemplate(result)
    }

    const unsubs = [
      createUserExperimentTemplateMutation.finished.success.watch(onSaveSuccess),
      createProjectExperimentTemplateMutation.finished.success.watch(onSaveSuccess),
      updateExperimentTemplateMutation.finished.success.watch(onSaveSuccess),
      copyUserExperimentTemplateToProjectMutation.finished.success.watch(onSaveSuccess),
    ]

    return () => {
      unsubs.forEach(unsub => unsub())
    }
  }, [])

  const clearSelection = useCallback(() => {
    setCreating(false)
    setEditing(false)
    setSavedTemplate(null)
    select(null)
    setDraft(emptyTemplateDraft())
  }, [select])

  const selectTemplate = useCallback((template: ExperimentTemplateDto) => {
    setCreating(false)
    setEditing(false)
    setSavedTemplate(null)
    select(template.id)
    setDraft(templateToDraft(template))
  }, [select])

  const startCreate = useCallback(() => {
    setCreating(true)
    setEditing(false)
    setSavedTemplate(null)
    createNew()
    setDraft({
      name: defaultExperimentTemplateSeed.name,
      fields: defaultExperimentTemplateSeed.fieldDefinitions.map((f, order) => ({
        id: crypto.randomUUID(),
        label: f.label,
        required: f.required,
        order,
      })),
      defaultObservations: '',
      checklist: [],
    })
  }, [createNew])

  const startEdit = () => {
    if (!previewTemplate)
      return
    setDraft(templateToDraft(previewTemplate))
    setEditing(true)
  }

  const cancelForm = () => {
    if (creating) {
      setCreating(false)
      setDraft(emptyTemplateDraft())
      select(null)
      return
    }

    setEditing(false)
    if (previewTemplate)
      setDraft(templateToDraft(previewTemplate))
  }

  const handleSave = () => {
    const fieldDefinitions: ExperimentFieldDefinition[] = draft.fields.map((field, order) => ({
      id: field.id,
      label: field.label.trim(),
      required: field.required,
      order,
      ...(field.defaultValue?.trim() ? { defaultValue: field.defaultValue } : {}),
    }))

    const payload = {
      name: draft.name.trim(),
      fieldDefinitions,
      defaultObservations: draft.defaultObservations.trim() || null,
      defaultChecklist: draft.checklist
        .filter(item => item.text.trim())
        .map((item, order) => ({ text: item.text.trim(), order })),
    }

    save({
      scope,
      projectId,
      id: creating ? undefined : selected?.id,
      ...payload,
    })
  }

  const handleDelete = () => {
    if (!selected)
      return
    if (!confirmAction(`Удалить шаблон «${selected.name}»?`))
      return
    remove(selected.id)
    setCreating(false)
    setEditing(false)
    setSavedTemplate(null)
    setDraft(emptyTemplateDraft())
  }

  const handleCopyToProject = useCallback((sourceTemplateId: string) => {
    if (!projectId)
      return
    copyToProject({ projectId, sourceTemplateId })
  }, [copyToProject, projectId])

  const showForm = creating || editing
  const showPreview = Boolean(previewTemplate) && !showForm

  const readOnly = !canEdit
  const loading = scope === 'user' ? userPending : projectPending
  const personalTemplates = userTemplates ?? []
  const isSidebar = variant === 'sidebar'
  const editorOpen = showForm || showPreview

  const closeEditor = () => {
    if (showForm)
      cancelForm()
    else
      clearSelection()
  }

  const editorTitle = creating
    ? 'Новый шаблон'
    : editing
      ? 'Редактирование шаблона'
      : previewTemplate?.name ?? 'Шаблон'

  const editorContent = (
    <>
      {showForm && (
        <>
          <TemplateEditorForm
            draft={draft}
            onChange={setDraft}
            readOnly={readOnly}
            observationsEditorKey={observationsEditorKey}
          />
          {canEdit && (
            <Group mt="md">
              <Button loading={savePending} onClick={handleSave} disabled={!draft.name.trim()}>
                Сохранить
              </Button>
              <Button variant="subtle" onClick={cancelForm}>
                Отмена
              </Button>
            </Group>
          )}
        </>
      )}

      {showPreview && previewTemplate && (
        <>
          <TemplatePreview template={previewTemplate} showTitle={!isSidebar} />
          {canEdit && (
            <Group mt="md">
              <Button
                variant="light"
                leftSection={<IconPencil size={16} />}
                onClick={startEdit}
              >
                Редактировать
              </Button>
              <Button
                variant="subtle"
                color="red"
                loading={deletePending}
                onClick={handleDelete}
              >
                Удалить
              </Button>
            </Group>
          )}
        </>
      )}
    </>
  )

  return (
    <Stack gap="md">
      <Group justify="space-between" wrap="nowrap">
        {isSidebar
          ? (
              <Text fw={600} size="sm">
                {title}
              </Text>
            )
          : (
              <Title order={4}>{title}</Title>
            )}
        {canEdit && (
          <Button
            variant="light"
            size={isSidebar ? 'compact-xs' : 'sm'}
            leftSection={<IconPlus size={16} />}
            onClick={startCreate}
          >
            {isSidebar ? 'Новый' : 'Новый шаблон'}
          </Button>
        )}
      </Group>

      {scope === 'project' && (
        <PersonalTemplatesCopyPanel
          canEdit={canEdit}
          projectId={projectId}
          userPending={userPending}
          personalTemplates={personalTemplates}
          copyPending={copyPending}
          onCopy={handleCopyToProject}
        />
      )}

      {loading && <Text size="sm" c="dimmed">Загрузка…</Text>}

      {!loading && templates.length === 0 && !creating && (
        <Text size="sm" c="dimmed">
          Шаблонов пока нет.
          {scope === 'project' && ' У нового проекта обычно есть «Стандартный шаблон».'}
        </Text>
      )}

      <TemplatePicker
        templates={templates}
        selectedId={selectedId}
        creating={creating}
        onSelect={selectTemplate}
        onDeselect={clearSelection}
        orientation={isSidebar ? 'vertical' : 'horizontal'}
      />

      {isSidebar
        ? (
            <Modal
              opened={editorOpen}
              onClose={closeEditor}
              title={editorTitle}
              size="lg"
            >
              {editorContent}
            </Modal>
          )
        : (
            editorOpen && (
              <Paper withBorder p="md">
                {editorContent}
              </Paper>
            )
          )}
    </Stack>
  )
}
