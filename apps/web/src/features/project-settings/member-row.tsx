import type { ProjectMemberDto } from '@labcollab/shared'
import {
  ActionIcon,
  Badge,
  Group,
  Select,
  Stack,
  Text,
} from '@mantine/core'
import { IconTrash } from '@tabler/icons-react'
import { projectRoleMeta } from '@/shared/lib'

interface MemberRowProps {
  member: ProjectMemberDto
  canManage: boolean
  onRoleChange: (role: 'editor' | 'viewer') => void
  onRemove: () => void
}

export function MemberRow({
  member,
  canManage,
  onRoleChange,
  onRemove,
}: MemberRowProps) {
  const meta = projectRoleMeta[member.role]
  const isOwner = member.role === 'owner'

  return (
    <Group justify="space-between" wrap="nowrap" align="flex-start">
      <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
        <Text size="sm" fw={600} lineClamp={1}>
          {member.displayName}
        </Text>
        <Text size="xs" c="dimmed" lineClamp={1}>
          {member.email}
        </Text>
      </Stack>

      {canManage && !isOwner
        ? (
            <Group gap="xs" wrap="nowrap">
              <Select
                size="xs"
                w={130}
                value={member.role}
                onChange={v => onRoleChange((v ?? 'editor') as 'editor' | 'viewer')}
                data={[
                  { value: 'editor', label: 'Редактор' },
                  { value: 'viewer', label: 'Наблюдатель' },
                ]}
              />
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                aria-label="Удалить участника"
                onClick={onRemove}
              >
                <IconTrash size={16} stroke={1.5} />
              </ActionIcon>
            </Group>
          )
        : (
            <Badge variant="light" color={meta.color} size="sm">
              {meta.label}
            </Badge>
          )}
    </Group>
  )
}
