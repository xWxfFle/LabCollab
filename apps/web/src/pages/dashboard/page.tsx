import { useForm } from '@effector-reform/react';
import { useUnit } from 'effector-react';
import type { ProjectDto } from '@labcollab/shared';
import { Button, Group, Modal, Stack, Text, TextInput, Textarea, Title } from '@mantine/core';
import { AppShellLayout } from '@/layouts/app-shell';
import { createProjectMutation, projectsQuery } from '@/shared/api/projects';
import { RouteLink, routes } from '@/shared/routing';
import {
  $createModalOpened,
  createFormModel,
  createModalClosed,
  createModalOpened,
} from './model';

export default function DashboardPage() {
  const [projects, pending, createPending, modalOpened] = useUnit([
    projectsQuery.$data,
    projectsQuery.$pending,
    createProjectMutation.$pending,
    $createModalOpened,
  ]);
  const openModal = useUnit(createModalOpened);
  const closeModal = useUnit(createModalClosed);
  const { fields, onSubmit, errors } = useForm(createFormModel);

  const list = (projects ?? []) as ProjectDto[];

  return (
    <AppShellLayout>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Проекты</Title>
        <Button onClick={() => openModal()}>Создать проект</Button>
      </Group>
      <Stack>
        {list.map((p) => (
          <RouteLink
            key={p.id}
            to={routes.projectView}
            params={{ id: p.id }}
            boxProps={{
              p: 'md',
              bg: 'var(--mantine-color-blue-light)',
              style: { borderRadius: 'var(--mantine-radius-default)' },
            }}
          >
            <Stack gap={4} align="flex-start">
              <Text fw={600}>{p.name}</Text>
              {p.description && (
                <Text size="sm" c="dimmed">
                  {p.description}
                </Text>
              )}
            </Stack>
          </RouteLink>
        ))}
        {!pending && list.length === 0 && (
          <Text c="dimmed">Нет проектов — создайте первый</Text>
        )}
      </Stack>
      <Modal opened={modalOpened} onClose={() => closeModal()} title="Новый проект">
        <form onSubmit={onSubmit}>
          <Stack>
            <TextInput
              label="Название"
              value={fields.name.value}
              onChange={(e) => fields.name.onChange(e.currentTarget.value)}
              onBlur={fields.name.onBlur}
              error={typeof errors.name === 'string' ? errors.name : undefined}
              required
            />
            <Textarea
              label="Описание"
              value={fields.description.value}
              onChange={(e) => fields.description.onChange(e.currentTarget.value)}
              onBlur={fields.description.onBlur}
            />
            <Button type="submit" loading={createPending} disabled={!fields.name.value.trim()}>
              Создать
            </Button>
          </Stack>
        </form>
      </Modal>
    </AppShellLayout>
  );
}
