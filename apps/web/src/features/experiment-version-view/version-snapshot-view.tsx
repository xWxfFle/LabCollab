import type { ExperimentSnapshot, LegacyExperimentSnapshot } from '@labcollab/shared'
import { Paper, Stack, Text, Textarea } from '@mantine/core'
import { ObservationsEditor } from '@/features/observations-editor'
import { experimentStatusLabels } from '@/shared/lib'

interface VersionSnapshotViewProps {
  snapshot: ExperimentSnapshot | LegacyExperimentSnapshot | Record<string, unknown>
  editorKey: string
}

function isLegacySnapshot(
  snapshot: ExperimentSnapshot | LegacyExperimentSnapshot | Record<string, unknown>,
): snapshot is LegacyExperimentSnapshot {
  return 'objective' in snapshot && !('fieldDefinitions' in snapshot)
}

function isModernSnapshot(
  snapshot: ExperimentSnapshot | LegacyExperimentSnapshot | Record<string, unknown>,
): snapshot is ExperimentSnapshot {
  return Array.isArray((snapshot as ExperimentSnapshot).fieldDefinitions)
}

function ReadOnlyField({ label, value }: { label: string, value: string | null | undefined }) {
  if (!value)
    return null
  return <Textarea label={label} value={value} readOnly autosize minRows={1} />
}

export function VersionSnapshotView({ snapshot, editorKey }: VersionSnapshotViewProps) {
  const status = (snapshot as { status?: string }).status
  const title = (snapshot as { title?: string }).title ?? ''
  const tags = (snapshot as { tags?: string[] }).tags
  const observationsText = (snapshot as { observationsText?: string | null }).observationsText

  return (
    <Stack gap="sm">
      <Text size="sm" fw={500}>
        {title}
      </Text>
      <Text size="xs" c="dimmed">
        Статус:
        {' '}
        {status
          ? (experimentStatusLabels[status as keyof typeof experimentStatusLabels]
            ?? (status === 'completed' ? 'Завершён (архив)' : status))
          : '—'}
      </Text>

      {isModernSnapshot(snapshot) && (
        <>
          {[...snapshot.fieldDefinitions]
            .sort((a, b) => a.order - b.order)
            .map(field => (
              <ReadOnlyField
                key={field.id}
                label={field.label}
                value={snapshot.fieldValues[field.id]}
              />
            ))}
          {snapshot.checklist.length > 0 && (
            <Paper withBorder p="xs">
              <Text size="xs" c="dimmed" mb={4}>
                Чеклист
              </Text>
              {[...snapshot.checklist]
                .sort((a, b) => a.order - b.order)
                .map(item => (
                  <Text key={item.id} size="sm">
                    {item.done ? '✓' : '○'}
                    {' '}
                    {item.text}
                  </Text>
                ))}
            </Paper>
          )}
        </>
      )}

      {isLegacySnapshot(snapshot) && (
        <>
          <ReadOnlyField label="Цель" value={snapshot.objective} />
          <ReadOnlyField label="Гипотеза" value={snapshot.hypothesis} />
          <ReadOnlyField label="Материалы" value={snapshot.materials} />
          <ReadOnlyField label="Протокол" value={snapshot.protocolSteps} />
          <ReadOnlyField label="Условия" value={snapshot.conditions} />
          <ReadOnlyField label="Результаты" value={snapshot.results} />
        </>
      )}

      {tags && tags.length > 0 && (
        <Paper withBorder p="xs">
          <Text size="xs" c="dimmed" mb={4}>
            Теги
          </Text>
          <Text size="sm">{tags.join(', ')}</Text>
        </Paper>
      )}
      <ObservationsEditor
        editorKey={`${editorKey}-snapshot`}
        content={observationsText ?? ''}
        onChange={() => {}}
        readOnly
      />
    </Stack>
  )
}
