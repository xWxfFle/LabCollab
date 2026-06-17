import { Button, Group, Modal, Stack, Text, TextInput, Title } from '@mantine/core'
import { useUnit } from 'effector-react'
import { useState } from 'react'
import { deleteProjectMutation, projectQuery } from '@/shared/api'
import { deleteProjectConfirmed } from './model'

export function DangerSettingsTab() {
  const [deletePending, project, confirmDelete] = useUnit([
    deleteProjectMutation.$pending,
    projectQuery.$data,
    deleteProjectConfirmed,
  ])

  const [modalOpened, setModalOpened] = useState(false)
  const [confirmName, setConfirmName] = useState('')

  const projectName = project?.name ?? ''
  const nameMatches = confirmName.trim() === projectName

  const closeModal = () => {
    setModalOpened(false)
    setConfirmName('')
  }

  const handleDeleteProject = () => {
    if (!nameMatches || deletePending)
      return
    confirmDelete()
  }

  return (
    <>
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
          onClick={() => setModalOpened(true)}
        >
          Удалить проект
        </Button>
      </Stack>

      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title="Удалить проект?"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Будут удалены все страницы, эксперименты, вложения и шаблоны проекта
            {' '}
            <Text component="span" fw={600}>
              «
              {projectName}
              »
            </Text>
            . Это действие нельзя отменить.
          </Text>
          <TextInput
            label="Введите название проекта для подтверждения"
            placeholder={projectName}
            value={confirmName}
            onChange={e => setConfirmName(e.currentTarget.value)}
            autoComplete="off"
            data-autofocus
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeModal}>
              Отмена
            </Button>
            <Button
              color="red"
              loading={deletePending}
              disabled={!nameMatches}
              onClick={handleDeleteProject}
            >
              Удалить проект
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
