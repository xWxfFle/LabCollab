import type { WorkspaceNodeDto } from '@labcollab/shared';
import { useForm } from '@effector-reform/react';
import { useUnit } from 'effector-react';
import type { ReactNode } from 'react';
import {
  AppShell,
  Button,
  Group,
  Modal,
  Select,
  Stack,
  TextInput,
} from '@mantine/core';
import { ProjectSidebar } from '@/features/project-sidebar';
import { WorkspaceMoveModal } from '@/features/project-sidebar/workspace-move-modal';
import { workspaceQuery } from '@/shared/api';
import { RouteTextLink, routes } from '@/shared/routing';
import { signedOut } from '@/shared/viewer';
import {
  $canManage,
  $createExperimentModalOpened,
  $memberModalOpened,
  $moveModalOpened,
  $moveTarget,
  $projectId,
  createExperimentForm,
  createExperimentModalClosed,
  memberForm,
  memberModalClosed,
  memberModalOpened,
  nodeMoveConfirmed,
  nodeMoveModalClosed,
} from './model';

interface ProjectWorkspaceLayoutProps {
  children: ReactNode;
  activePageId?: string | null;
  activeExperimentId?: string | null;
}

export function ProjectWorkspaceLayout({
  children,
  activePageId = null,
  activeExperimentId = null,
}: ProjectWorkspaceLayoutProps) {
  const [
    projectId,
    modalOpened,
    createModalOpened,
    canManage,
    moveModalOpened,
    moveTarget,
    tree,
  ] = useUnit([
    $projectId,
    $memberModalOpened,
    $createExperimentModalOpened,
    $canManage,
    $moveModalOpened,
    $moveTarget,
    workspaceQuery.$data,
  ]);

  const logout = useUnit(signedOut);
  const openMemberModal = useUnit(memberModalOpened);
  const closeMemberModal = useUnit(memberModalClosed);
  const closeCreateModal = useUnit(createExperimentModalClosed);
  const closeMoveModal = useUnit(nodeMoveModalClosed);
  const confirmMove = useUnit(nodeMoveConfirmed);
  const { fields: memberFields, onSubmit: onMemberSubmit } = useForm(memberForm);
  const { fields: createFields, onSubmit: onCreateSubmit } = useForm(createExperimentForm);

  if (!projectId) {
    return null;
  }

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 280, breakpoint: 'sm' }}
      padding="md"
    >
      <AppShell.Header px="md">
        <Group h="100%" justify="space-between">
          <RouteTextLink to={routes.dashboard} c="blue">
            ← Проекты
          </RouteTextLink>
          {canManage && (
            <Button variant="light" size="xs" onClick={() => openMemberModal()}>
              Участник
            </Button>
          )}
          <Button variant="subtle" size="xs" onClick={() => logout()}>
            Выйти
          </Button>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <ProjectSidebar
          projectId={projectId}
          activePageId={activePageId}
          activeExperimentId={activeExperimentId}
        />
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>

      <Modal opened={modalOpened} onClose={() => closeMemberModal()} title="Добавить участника">
        <form onSubmit={onMemberSubmit}>
          <Stack>
            <TextInput
              label="Email"
              value={memberFields.email.value}
              onChange={(e) => memberFields.email.onChange(e.currentTarget.value)}
              onBlur={memberFields.email.onBlur}
            />
            <Select
              label="Роль"
              value={memberFields.role.value}
              onChange={(v) =>
                memberFields.role.onChange((v ?? 'editor') as 'editor' | 'viewer')
              }
              data={[
                { value: 'editor', label: 'Редактор' },
                { value: 'viewer', label: 'Только чтение' },
              ]}
            />
            <Button type="submit">Добавить</Button>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={createModalOpened}
        onClose={() => closeCreateModal()}
        title="Новый эксперимент"
      >
        <form onSubmit={onCreateSubmit}>
          <Stack>
            <TextInput
              label="Название"
              required
              value={createFields.title.value}
              onChange={(e) => createFields.title.onChange(e.currentTarget.value)}
              onBlur={createFields.title.onBlur}
            />
            <TextInput
              label="Цель"
              required
              value={createFields.objective.value}
              onChange={(e) => createFields.objective.onChange(e.currentTarget.value)}
              onBlur={createFields.objective.onBlur}
            />
            <Button type="submit">Создать</Button>
          </Stack>
        </form>
      </Modal>

      <WorkspaceMoveModal
        opened={moveModalOpened}
        tree={(tree ?? []) as WorkspaceNodeDto[]}
        nodeId={moveTarget?.nodeId ?? null}
        nodeType={moveTarget?.type ?? null}
        onClose={() => closeMoveModal()}
        onConfirm={(parentId) => confirmMove(parentId)}
      />
    </AppShell>
  );
}
