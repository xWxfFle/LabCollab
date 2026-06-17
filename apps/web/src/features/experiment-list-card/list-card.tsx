import type { ExperimentDto } from '@labcollab/shared'
import { Badge, Box, Group, Paper, SimpleGrid, Stack, Text } from '@mantine/core'
import { experimentStatusMeta } from '@/shared/lib'

const textFields: { key: keyof ExperimentDto, label: string }[] = [
  { key: 'objective', label: 'Цель' },
  { key: 'hypothesis', label: 'Гипотеза' },
  { key: 'materials', label: 'Материалы' },
  { key: 'protocolSteps', label: 'Протокол' },
  { key: 'conditions', label: 'Условия' },
  { key: 'results', label: 'Результаты' },
]

const maxFieldLines = 4

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fieldPreview(value: string | null | undefined, max = 120) {
  if (!value?.trim())
    return null
  const text = value.trim()
  return text.length > max ? `${text.slice(0, max)}…` : text
}

function filledTextFields(experiment: ExperimentDto) {
  return textFields.flatMap(({ key, label }) => {
    const value = experiment[key]
    if (typeof value !== 'string')
      return []
    const preview = fieldPreview(value, 100)
    if (!preview)
      return []
    return [{ label, preview }]
  })
}

interface ExperimentListCardProps {
  experiment: ExperimentDto
}

export function ExperimentListCard({ experiment }: ExperimentListCardProps) {
  const status = experimentStatusMeta[experiment.status]
  const allFields = filledTextFields(experiment)
  const fields = allFields.slice(0, maxFieldLines)
  const hiddenFieldsCount = allFields.length - fields.length

  return (
    <Paper
      withBorder
      radius="md"
      p="md"
      styles={{
        root: {
          'transition': 'box-shadow 150ms ease, border-color 150ms ease',
          '&:hover': {
            boxShadow: 'var(--mantine-shadow-sm)',
            borderColor: 'var(--mantine-color-blue-3)',
          },
        },
      }}
    >
      <Group align="flex-start" wrap="wrap" gap="lg">
        <Stack gap="sm" style={{ flex: '1 1 320px', minWidth: 0 }}>
          <Text fw={700} size="lg" lh={1.3} lineClamp={2}>
            {experiment.title}
          </Text>

          {fields.length > 0 && (
            <Stack gap="xs">
              <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="md" verticalSpacing="xs">
                {fields.map(({ label, preview }) => (
                  <Box key={label}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600} lh={1.2} mb={2}>
                      {label}
                    </Text>
                    <Text size="sm" lh={1.45} lineClamp={2}>
                      {preview}
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>
              {hiddenFieldsCount > 0 && (
                <Text size="xs" c="dimmed">
                  Ещё
                  {' '}
                  {hiddenFieldsCount}
                  {' '}
                  заполненных полей
                </Text>
              )}
            </Stack>
          )}
        </Stack>

        <Stack
          gap="sm"
          align="flex-end"
          style={{ flex: '0 1 240px', minWidth: 200, textAlign: 'right' }}
        >
          <Badge variant="light" color={status.color} size="md" radius="sm">
            {status.label}
          </Badge>

          {experiment.tags.length > 0 && (
            <Group gap={6} justify="flex-end">
              {experiment.tags.map(tag => (
                <Badge key={tag} variant="outline" color="gray" size="sm" radius="sm">
                  {tag}
                </Badge>
              ))}
            </Group>
          )}

          <Stack gap={2} align="flex-end" mt="auto">
            <Text size="sm" fw={500} lineClamp={1}>
              {experiment.authorDisplayName ?? 'Автор неизвестен'}
            </Text>
            <Text size="xs" c="dimmed">
              Изменён
              {' '}
              {formatDateTime(experiment.updatedAt)}
            </Text>
            {experiment.conductedAt && (
              <Text size="xs" c="dimmed">
                Проведён
                {' '}
                {formatDateTime(experiment.conductedAt)}
              </Text>
            )}
          </Stack>
        </Stack>
      </Group>
    </Paper>
  )
}
