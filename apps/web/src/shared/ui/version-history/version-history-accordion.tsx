import type { VersionHistoryItem } from '@/shared/lib/version-history'
import { Accordion, Stack, Text } from '@mantine/core'
import { formatVersionDate } from '@/shared/lib/version-history'
import { VersionHistoryCard } from './version-history-card'

interface VersionHistoryAccordionProps {
  items: VersionHistoryItem[]
  emptyMessage: string
  onItemSelect: (id: string) => void
}

export function VersionHistoryAccordion({
  items,
  emptyMessage,
  onItemSelect,
}: VersionHistoryAccordionProps) {
  const latest = items[0]

  return (
    <Accordion variant="contained" chevronPosition="right">
      <Accordion.Item value="versions">
        <Accordion.Control>
          <Stack gap={2}>
            <Text size="sm" fw={500}>
              История версий (
              {items.length}
              )
            </Text>
            {latest && (
              <Text size="xs" c="dimmed">
                Последнее изменение:
                {' '}
                {latest.createdByDisplayName}
                {' · '}
                {formatVersionDate(latest.createdAt)}
              </Text>
            )}
          </Stack>
        </Accordion.Control>
        <Accordion.Panel>
          {items.length === 0
            ? (
                <Text size="sm" c="dimmed">
                  {emptyMessage}
                </Text>
              )
            : (
                <Stack gap="xs">
                  {items.map(item => (
                    <VersionHistoryCard
                      key={item.id}
                      item={item}
                      onSelect={() => onItemSelect(item.id)}
                    />
                  ))}
                </Stack>
              )}
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  )
}
