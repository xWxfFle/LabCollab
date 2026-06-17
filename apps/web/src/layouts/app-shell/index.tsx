import type { ReactNode } from 'react'
import { AppShell, Group } from '@mantine/core'
import { AppBrand, UserMenu } from '@/shared/ui/app-shell'

export function AppShellLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header px="md">
        <Group h="100%" justify="space-between" wrap="nowrap">
          <AppBrand />
          <UserMenu />
        </Group>
      </AppShell.Header>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  )
}
