import type { ProjectMemberDto } from '@labcollab/shared'
import { useForm } from '@effector-reform/react'
import { Button, Select, Stack, Text, TextInput, Title } from '@mantine/core'
import { useUnit } from 'effector-react'
import { $canManage } from '@/features/project-sidebar/model'
import { addMemberMutation, projectMembersQuery } from '@/shared/api'
import { confirmAction } from '@/shared/lib'
import { WorkspaceAreaLoader } from '@/shared/ui/placeholders'
import { MemberRow } from './member-row'
import { memberForm, memberRemoveConfirmed, memberRoleChanged } from './model'

export function MembersSettingsTab() {
  const [canManage, members, membersPending, addPending] = useUnit([
    $canManage,
    projectMembersQuery.$data,
    projectMembersQuery.$pending,
    addMemberMutation.$pending,
  ])

  const changeRole = useUnit(memberRoleChanged)
  const removeMember = useUnit(memberRemoveConfirmed)
  const { fields, onSubmit } = useForm(memberForm)

  const list = (members ?? []) as ProjectMemberDto[]

  const handleRemoveMember = (member: ProjectMemberDto) => {
    if (!confirmAction(`Удалить участника ${member.displayName} из проекта?`)) {
      return
    }
    removeMember(member.userId)
  }

  return (
    <Stack gap="md" maw={640}>
      <Title order={3}>Участники</Title>

      <Stack gap="sm">
        {membersPending && list.length === 0
          ? <WorkspaceAreaLoader label="Загрузка участников…" />
          : list.map(member => (
              <MemberRow
                key={member.userId}
                member={member}
                canManage={canManage}
                onRoleChange={role => changeRole({ userId: member.userId, role })}
                onRemove={() => handleRemoveMember(member)}
              />
            ))}
      </Stack>

      {canManage && (
        <form onSubmit={onSubmit}>
          <Stack gap="sm" mt="md">
            <Text size="sm" fw={500}>
              Добавить участника
            </Text>
            <TextInput
              label="Email"
              placeholder="user@lab.local"
              value={fields.email.value}
              onChange={e => fields.email.onChange(e.currentTarget.value)}
              onBlur={fields.email.onBlur}
              required
            />
            <Select
              label="Роль"
              value={fields.role.value}
              onChange={v => fields.role.onChange((v ?? 'editor') as 'editor' | 'viewer')}
              data={[
                { value: 'editor', label: 'Редактор' },
                { value: 'viewer', label: 'Только чтение' },
              ]}
            />
            <Button type="submit" variant="light" loading={addPending}>
              Пригласить
            </Button>
          </Stack>
        </form>
      )}
    </Stack>
  )
}
