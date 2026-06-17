import type { ExperimentSnapshot } from '@labcollab/shared'
import { Paper, Stack, Text, Textarea } from '@mantine/core'
import { ObservationsEditor } from '@/features/observations-editor'
import { experimentStatusLabels } from '@/shared/lib'

interface VersionSnapshotViewProps {
  snapshot: ExperimentSnapshot
  editorKey: string
}

function ReadOnlyField({ label, value }: { label: string, value: string | null | undefined }) {
  if (!value)
    return null
  return <Textarea label={label} value={value} readOnly autosize minRows={1} />
}

export function VersionSnapshotView({ snapshot, editorKey }: VersionSnapshotViewProps) {
  return (
    <Stack gap="sm">
      <Text size="sm" fw={500}>
        {snapshot.title}
      </Text>
      <Text size="xs" c="dimmed">
        Статус:
        {' '}
        {experimentStatusLabels[snapshot.status] ?? snapshot.status}
      </Text>
      <ReadOnlyField label="Цель" value={snapshot.objective} />
      <ReadOnlyField label="Гипотеза" value={snapshot.hypothesis} />
      <ReadOnlyField label="Материалы" value={snapshot.materials} />
      <ReadOnlyField label="Протокол" value={snapshot.protocolSteps} />
      <ReadOnlyField label="Условия" value={snapshot.conditions} />
      <ReadOnlyField label="Результаты" value={snapshot.results} />
      {snapshot.tags && snapshot.tags.length > 0 && (
        <Paper withBorder p="xs">
          <Text size="xs" c="dimmed" mb={4}>
            Теги
          </Text>
          <Text size="sm">{snapshot.tags.join(', ')}</Text>
        </Paper>
      )}
      <ObservationsEditor
        editorKey={`${editorKey}-snapshot`}
        content={snapshot.observationsText ?? ''}
        onChange={() => {}}
        readOnly
      />
    </Stack>
  )
}
