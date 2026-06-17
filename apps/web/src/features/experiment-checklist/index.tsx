import type { ExperimentChecklistItem } from '@labcollab/shared'
import { ActionIcon, Button, Checkbox, Group, Input, Stack, TextInput } from '@mantine/core'
import { IconPlus, IconTrash } from '@tabler/icons-react'

interface ExperimentChecklistProps {
  items: ExperimentChecklistItem[]
  readOnly?: boolean
  onChange: (items: ExperimentChecklistItem[]) => void
}

export function ExperimentChecklist({ items, readOnly, onChange }: ExperimentChecklistProps) {
  const sorted = [...items].sort((a, b) => a.order - b.order)

  if (sorted.length === 0)
    return null

  const updateItem = (id: string, patch: Partial<ExperimentChecklistItem>) => {
    onChange(items.map(item => (item.id === id ? { ...item, ...patch } : item)))
  }

  const removeItem = (id: string) => {
    onChange(
      items
        .filter(item => item.id !== id)
        .map((item, order) => ({ ...item, order })),
    )
  }

  const addItem = () => {
    onChange([
      ...items,
      {
        id: crypto.randomUUID(),
        text: '',
        done: false,
        order: items.length,
      },
    ])
  }

  return (
    <Input.Wrapper label="Чеклист">
      <Stack gap="xs">
        {sorted.map(item => (
          <Group key={item.id} align="flex-start" wrap="nowrap">
            <Checkbox
              checked={item.done}
              onChange={e => updateItem(item.id, { done: e.currentTarget.checked })}
              disabled={readOnly}
              mt={4}
              aria-label="Выполнено"
            />
            <TextInput
              value={item.text}
              onChange={e => updateItem(item.id, { text: e.currentTarget.value })}
              readOnly={readOnly}
              placeholder="Что нужно сделать"
              style={{ flex: 1 }}
            />
            {!readOnly && (
              <ActionIcon
                variant="subtle"
                color="red"
                onClick={() => removeItem(item.id)}
                aria-label="Удалить пункт"
              >
                <IconTrash size={16} />
              </ActionIcon>
            )}
          </Group>
        ))}
        {!readOnly && (
          <Button variant="light" leftSection={<IconPlus size={16} />} onClick={addItem}>
            Добавить пункт
          </Button>
        )}
      </Stack>
    </Input.Wrapper>
  )
}
