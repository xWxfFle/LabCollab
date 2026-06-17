import type { TemplateChecklistDraft, TemplateDraft, TemplateFieldDraft } from './template-draft'
import {
  ActionIcon,
  Button,
  Checkbox,
  Group,
  Paper,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core'
import { IconArrowDown, IconArrowUp, IconPlus, IconTrash } from '@tabler/icons-react'
import { memo, useCallback, useRef } from 'react'
import { ObservationsEditor } from '@/features/observations-editor'

interface TemplateEditorFormProps {
  draft: TemplateDraft
  onChange: (next: TemplateDraft) => void
  readOnly: boolean
  observationsEditorKey: string
}

const TemplateNameField = memo(({
  value,
  readOnly,
  onChange,
}: {
  value: string
  readOnly: boolean
  onChange: (name: string) => void
}) => (
  <TextInput
    label="Название шаблона"
    value={value}
    onChange={e => onChange(e.currentTarget.value)}
    readOnly={readOnly}
    required
  />
))

const TemplateFieldsSection = memo(({
  fields,
  readOnly,
  onChange,
}: {
  fields: TemplateFieldDraft[]
  readOnly: boolean
  onChange: (fields: TemplateFieldDraft[]) => void
}) => {
  const moveField = (index: number, direction: -1 | 1) => {
    const next = [...fields]
    const target = index + direction
    if (target < 0 || target >= next.length)
      return
    const tmp = next[index]
    next[index] = next[target]
    next[target] = tmp
    onChange(next.map((field, order) => ({ ...field, order })))
  }

  return (
    <>
      <Text size="sm" fw={500}>
        Поля
      </Text>
      {fields.map((field, index) => (
        <Paper key={field.id} withBorder p="sm">
          <Stack gap="xs">
            <Group align="flex-end" wrap="nowrap">
              <TextInput
                label="Метка поля"
                value={field.label}
                onChange={(e) => {
                  const next = [...fields]
                  next[index] = { ...field, label: e.currentTarget.value }
                  onChange(next)
                }}
                readOnly={readOnly}
                style={{ flex: 1 }}
                required
              />
              {!readOnly && (
                <Group gap={4} wrap="nowrap">
                  <ActionIcon
                    variant="subtle"
                    disabled={index === 0}
                    onClick={() => moveField(index, -1)}
                    aria-label="Выше"
                  >
                    <IconArrowUp size={16} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    disabled={index === fields.length - 1}
                    onClick={() => moveField(index, 1)}
                    aria-label="Ниже"
                  >
                    <IconArrowDown size={16} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    disabled={fields.length <= 1}
                    onClick={() => {
                      onChange(
                        fields
                          .filter((_, i) => i !== index)
                          .map((f, order) => ({ ...f, order })),
                      )
                    }}
                    aria-label="Удалить поле"
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              )}
            </Group>
            <Checkbox
              label="Обязательное"
              checked={field.required}
              onChange={(e) => {
                const next = [...fields]
                next[index] = { ...field, required: e.currentTarget.checked }
                onChange(next)
              }}
              disabled={readOnly}
            />
            <Textarea
              label="Значение по умолчанию"
              value={field.defaultValue ?? ''}
              onChange={(e) => {
                const next = [...fields]
                next[index] = { ...field, defaultValue: e.currentTarget.value }
                onChange(next)
              }}
              readOnly={readOnly}
              autosize
              minRows={1}
            />
          </Stack>
        </Paper>
      ))}

      {!readOnly && (
        <Button
          variant="light"
          leftSection={<IconPlus size={16} />}
          onClick={() =>
            onChange([
              ...fields,
              {
                id: crypto.randomUUID(),
                label: 'Новое поле',
                required: false,
                order: fields.length,
              },
            ])}
        >
          Добавить поле
        </Button>
      )}
    </>
  )
})

const TemplateObservationsSection = memo(({
  editorKey,
  content,
  readOnly,
  onChange,
}: {
  editorKey: string
  content: string
  readOnly: boolean
  onChange: (html: string) => void
}) => (
  <>
    <Text size="sm" fw={500} mt="sm">
      Наблюдения по умолчанию
    </Text>
    <ObservationsEditor
      editorKey={editorKey}
      content={content}
      onChange={onChange}
      readOnly={readOnly}
    />
  </>
))

const TemplateChecklistSection = memo(({
  checklist,
  readOnly,
  onChange,
}: {
  checklist: TemplateChecklistDraft[]
  readOnly: boolean
  onChange: (checklist: TemplateChecklistDraft[]) => void
}) => (
  <>
    <Text size="sm" fw={500}>
      Чеклист по умолчанию
    </Text>
    {checklist.map((item, index) => (
      <Group key={item.id} align="flex-end" wrap="nowrap">
        <TextInput
          label={index === 0 ? 'Пункт' : undefined}
          value={item.text}
          onChange={(e) => {
            const text = e.currentTarget.value
            onChange(
              checklist.map(c => (c.id === item.id ? { ...c, text } : c)),
            )
          }}
          readOnly={readOnly}
          style={{ flex: 1 }}
        />
        {!readOnly && (
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={() => {
              onChange(
                checklist
                  .filter(c => c.id !== item.id)
                  .map((c, order) => ({ ...c, order })),
              )
            }}
            aria-label="Удалить пункт"
          >
            <IconTrash size={16} />
          </ActionIcon>
        )}
      </Group>
    ))}
    {!readOnly && (
      <Button
        variant="light"
        leftSection={<IconPlus size={16} />}
        onClick={() =>
          onChange([
            ...checklist,
            { id: crypto.randomUUID(), text: '', order: checklist.length },
          ])}
      >
        Добавить пункт чеклиста
      </Button>
    )}
  </>
))

export const TemplateEditorForm = memo(({
  draft,
  onChange,
  readOnly,
  observationsEditorKey,
}: TemplateEditorFormProps) => {
  const draftRef = useRef(draft)
  draftRef.current = draft

  const onNameChange = useCallback((name: string) => {
    onChange({ ...draftRef.current, name })
  }, [onChange])

  const onFieldsChange = useCallback((fields: TemplateFieldDraft[]) => {
    onChange({ ...draftRef.current, fields })
  }, [onChange])

  const onObservationsChange = useCallback((defaultObservations: string) => {
    onChange({ ...draftRef.current, defaultObservations })
  }, [onChange])

  const onChecklistChange = useCallback((checklist: TemplateChecklistDraft[]) => {
    onChange({ ...draftRef.current, checklist })
  }, [onChange])

  return (
    <Stack gap="sm">
      <TemplateNameField
        value={draft.name}
        readOnly={readOnly}
        onChange={onNameChange}
      />
      <TemplateFieldsSection
        fields={draft.fields}
        readOnly={readOnly}
        onChange={onFieldsChange}
      />
      <TemplateObservationsSection
        editorKey={observationsEditorKey}
        content={draft.defaultObservations}
        readOnly={readOnly}
        onChange={onObservationsChange}
      />
      <TemplateChecklistSection
        checklist={draft.checklist}
        readOnly={readOnly}
        onChange={onChecklistChange}
      />
    </Stack>
  )
})
