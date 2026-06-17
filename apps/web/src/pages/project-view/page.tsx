import { Stack, Text, Title } from '@mantine/core'
import { useUnit } from 'effector-react'
import { ProjectWorkspaceLayout } from '@/layouts/project-workspace'
import { projectQuery, workspaceQuery } from './model'

export default function ProjectPage() {
  const [project, tree, projectPending, workspacePending] = useUnit([
    projectQuery.$data,
    workspaceQuery.$data,
    projectQuery.$pending,
    workspaceQuery.$pending,
  ])

  const loading = (projectPending || workspacePending) && !project
  const hasNodes = (tree?.length ?? 0) > 0

  return (
    <ProjectWorkspaceLayout loading={loading}>
      <Stack maw={640} mx="auto" gap="md" mt="xl">
        <Title order={2}>{project?.name ?? 'Проект'}</Title>
        {project?.description && (
          <Text c="dimmed">{project.description}</Text>
        )}
        <Text c="dimmed">
          {hasNodes
            ? 'Выберите страницу, папку или эксперимент в сайдбаре слева.'
            : 'Создайте первую страницу, папку или эксперимент через «+» в сайдбаре.'}
        </Text>
      </Stack>
    </ProjectWorkspaceLayout>
  )
}
