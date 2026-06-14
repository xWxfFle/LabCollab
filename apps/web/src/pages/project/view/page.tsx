import { useUnit } from 'effector-react';
import { Stack, Text, Title } from '@mantine/core';
import { ProjectWorkspaceLayout } from '@/layouts/project-workspace';
import { projectQuery, workspaceQuery } from '@/shared/api';

export default function ProjectPage() {
  const [project, tree] = useUnit([projectQuery.$data, workspaceQuery.$data]);

  const hasNodes = (tree?.length ?? 0) > 0;

  return (
    <ProjectWorkspaceLayout>
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
  );
}
