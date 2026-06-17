import type { ExperimentTemplateDto } from '@labcollab/shared'
import { Badge, Group, Paper, Stack, Text, Title } from '@mantine/core'
import { ObservationsEditor } from '@/features/observations-editor'

interface TemplatePreviewProps {
  template: ExperimentTemplateDto
  showTitle?: boolean
}

export function TemplatePreview({ template, showTitle = true }: TemplatePreviewProps) {
  const fields = [...template.fieldDefinitions].sort((a, b) => a.order - b.order)
  const checklist = [...template.defaultChecklist].sort((a, b) => a.order - b.order)

  return (
    <Stack gap="md">
      {showTitle && <Title order={5}>{template.name}</Title>}

      <Stack gap="xs">
        <Text size="sm" fw={500}>
          Поля
        </Text>
        {fields.map(field => (
          <Paper key={field.id} withBorder p="sm">
            <Stack gap={4}>
              <GroupFieldLabel label={field.label} required={field.required} />
              {field.defaultValue?.trim() && (
                <Text size="sm" c="dimmed">
                  По умолчанию:
                  {' '}
                  {field.defaultValue}
                </Text>
              )}
            </Stack>
          </Paper>
        ))}
      </Stack>

      <Stack gap="xs">
        <Text size="sm" fw={500}>
          Наблюдения по умолчанию
        </Text>
        {template.defaultObservations?.trim()
          ? (
              <ObservationsEditor
                editorKey={`template-preview-obs-${template.id}`}
                content={template.defaultObservations}
                onChange={() => {}}
                readOnly
              />
            )
          : (
              <Text size="sm" c="dimmed">
                Не заданы
              </Text>
            )}
      </Stack>

      <Stack gap="xs">
        <Text size="sm" fw={500}>
          Чеклист по умолчанию
        </Text>
        {checklist.length > 0
          ? (
              <Stack gap={4}>
                {checklist.map(item => (
                  <Text key={`${item.order}-${item.text}`} size="sm">
                    {item.order + 1}
                    .
                    {' '}
                    {item.text}
                  </Text>
                ))}
              </Stack>
            )
          : (
              <Text size="sm" c="dimmed">
                Пунктов нет
              </Text>
            )}
      </Stack>
    </Stack>
  )
}

function GroupFieldLabel({ label, required }: { label: string, required: boolean }) {
  return (
    <Group gap="xs" wrap="nowrap">
      <Text size="sm" fw={500} component="span">
        {label}
      </Text>
      {required && (
        <Badge size="xs" variant="light">
          обязательное
        </Badge>
      )}
    </Group>
  )
}
