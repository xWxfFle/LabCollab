import { Center, Loader } from '@mantine/core'
import { AppShellLayout } from './index'

/** Fallback lazy-маршрутов с AppShell — шапка остаётся, крутится лоадер в main. */
export function AppShellRouteFallback() {
  return (
    <AppShellLayout>
      <Center flex={1} mih={320}>
        <Loader />
      </Center>
    </AppShellLayout>
  )
}
