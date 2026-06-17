import type { WorkspaceSearchResultDto } from '@labcollab/shared'
import { Button, Modal, Stack, Text, TextInput } from '@mantine/core'
import { useUnit } from 'effector-react'
import { useState } from 'react'
import { workspaceSearchQuery } from '@/shared/api'

interface InternalLinkPickerProps {
  projectId: string
  opened: boolean
  onClose: () => void
  onSelect: (href: string, label: string) => void
}

export function InternalLinkPicker({
  projectId,
  opened,
  onClose,
  onSelect,
}: InternalLinkPickerProps) {
  const [query, setQuery] = useState('')
  const [results, searchPending] = useUnit([
    workspaceSearchQuery.$data,
    workspaceSearchQuery.$pending,
  ])

  const runSearch = () => {
    const q = query.trim()
    if (!q)
      return
    workspaceSearchQuery.start({ projectId, q })
  }

  const data = results as WorkspaceSearchResultDto | null

  return (
    <Modal opened={opened} onClose={onClose} title="Внутренняя ссылка" size="md">
      <Stack>
        <TextInput
          placeholder="Поиск страницы или эксперимента…"
          value={query}
          onChange={e => setQuery(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              runSearch()
            }
          }}
        />
        <Button loading={searchPending} onClick={runSearch}>
          Найти
        </Button>
        {data?.pages.map(page => (
          <Button
            key={page.id}
            variant="light"
            justify="flex-start"
            onClick={() => {
              onSelect(
                `/projects/${projectId}/pages/${page.id}`,
                page.title,
              )
              onClose()
            }}
          >
            📄
            {' '}
            {page.title}
          </Button>
        ))}
        {data?.experiments.map(exp => (
          <Button
            key={exp.id}
            variant="light"
            justify="flex-start"
            onClick={() => {
              onSelect(
                `/projects/${projectId}/experiments/${exp.id}`,
                exp.title,
              )
              onClose()
            }}
          >
            🧪
            {' '}
            {exp.title}
          </Button>
        ))}
        {data && data.pages.length === 0 && data.experiments.length === 0 && (
          <Text size="sm" c="dimmed">
            Ничего не найдено
          </Text>
        )}
      </Stack>
    </Modal>
  )
}
