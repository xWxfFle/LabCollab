import { Button, Stack, Text, Title } from '@mantine/core'
import { useUnit } from 'effector-react'
import { deleteProjectMutation } from '@/shared/api'
import { confirmAction } from '@/shared/lib'
import { deleteProjectConfirmed } from './model'

export function DangerSettingsTab() {
  const [deletePending, confirmDelete] = useUnit([
    deleteProjectMutation.$pending,
    deleteProjectConfirmed,
  ])

  const handleDeleteProject = () => {
    if (!confirmAction(
      'Удалить проект и все его данные? Это действие нельзя отменить.',
    )) {
      return
    }
    confirmDelete()
  }

  return (
    <Stack gap="md" maw={560}>
      <Title order={3} c="red">
        Опасная зона
      </Title>
      <Text size="sm" c="dimmed">
        Проект, страницы, эксперименты и вложения будут удалены безвозвратно.
      </Text>
      <Button
        color="red"
        variant="light"
        w="fit-content"
        loading={deletePending}
        onClick={handleDeleteProject}
      >
        Удалить проект
      </Button>
    </Stack>
  )
}
