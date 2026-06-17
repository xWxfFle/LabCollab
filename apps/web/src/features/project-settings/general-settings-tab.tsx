import { useForm } from '@effector-reform/react'
import { Button, Group, Stack, Textarea, TextInput, Title } from '@mantine/core'
import { useUnit } from 'effector-react'
import { $canManage } from '@/features/project-sidebar/model'
import { patchProjectMutation } from '@/shared/api'
import { projectSettingsForm } from './model'

export function GeneralSettingsTab() {
  const [canManage, savePending] = useUnit([
    $canManage,
    patchProjectMutation.$pending,
  ])

  const { fields, onSubmit } = useForm(projectSettingsForm)

  return (
    <Stack gap="md" maw={560}>
      <Title order={3}>Общее</Title>
      <form onSubmit={onSubmit}>
        <Stack gap="sm">
          <TextInput
            label="Название"
            value={fields.name.value}
            onChange={e => fields.name.onChange(e.currentTarget.value)}
            onBlur={fields.name.onBlur}
            readOnly={!canManage}
            required
          />
          <Textarea
            label="Описание"
            value={fields.description.value}
            onChange={e => fields.description.onChange(e.currentTarget.value)}
            onBlur={fields.description.onBlur}
            readOnly={!canManage}
            minRows={3}
          />
          {canManage && (
            <Group justify="flex-start">
              <Button type="submit" loading={savePending} disabled={!fields.name.value.trim()}>
                Сохранить изменения
              </Button>
            </Group>
          )}
        </Stack>
      </form>
    </Stack>
  )
}
