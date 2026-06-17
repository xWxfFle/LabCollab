import type { VersionHistoryItem } from '@/shared/lib/version-history'
import { Paper, Text } from '@mantine/core'
import { formatVersionDate } from '@/shared/lib/version-history'

interface VersionHistoryCardProps {
  item: VersionHistoryItem
  onSelect: () => void
}

export function VersionHistoryCard({ item, onSelect }: VersionHistoryCardProps) {
  return (
    <Paper
      withBorder
      p="sm"
      style={{ cursor: 'pointer' }}
      onClick={onSelect}
    >
      <Text size="sm" fw={500}>
        {item.title || 'Без названия'}
      </Text>
      <Text size="xs" c="dimmed">
        {item.createdByDisplayName}
        {' · '}
        {formatVersionDate(item.createdAt)}
      </Text>
      {item.preview && (
        <Text size="sm" mt={4} lineClamp={3}>
          {item.preview}
        </Text>
      )}
      <Text size="xs" c="violet" mt={4}>
        Открыть снапшот →
      </Text>
    </Paper>
  )
}
