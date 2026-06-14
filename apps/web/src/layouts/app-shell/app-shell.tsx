import { useUnit } from 'effector-react';
import { AppShell, Button, Group, Title } from '@mantine/core';
import type { ReactNode } from 'react';
import { signedOut } from '@/shared/viewer';

export function AppShellLayout({ children }: { children: ReactNode }) {
  const logout = useUnit(signedOut);

  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header px="md">
        <Group h="100%" justify="space-between">
          <Title order={3}>LabCollab</Title>
          <Button variant="subtle" onClick={() => logout()}>
            Выйти
          </Button>
        </Group>
      </AppShell.Header>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
