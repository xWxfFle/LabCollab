import { Center, Loader, Stack, Text } from '@mantine/core'

interface WorkspaceAreaLoaderProps {
  label?: string
}

/** Лоадер внутри AppShell.Main — не перекрывает шапку и сайдбар. */
export function WorkspaceAreaLoader({ label }: WorkspaceAreaLoaderProps) {
  return (
    <Center flex={1} mih={320}>
      <Stack align="center" gap="sm">
        <Loader type="oval" />
        {label && (
          <Text size="sm" c="dimmed">
            {label}
          </Text>
        )}
      </Stack>
    </Center>
  )
}
