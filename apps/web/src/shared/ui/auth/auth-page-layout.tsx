import type { ReactNode } from 'react'
import { Box, Paper, SimpleGrid, Stack } from '@mantine/core'
import { AuthIntroPanel } from './auth-intro-panel'

interface AuthPageLayoutProps {
  children: ReactNode
}

export function AuthPageLayout({ children }: AuthPageLayoutProps) {
  return (
    <Box
      component="main"
      mih="100dvh"
      px="md"
      py="xl"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'linear-gradient(160deg, var(--mantine-color-violet-0) 0%, var(--mantine-color-body) 45%, var(--mantine-color-grape-0) 100%)',
      }}
    >
      <Paper
        shadow="md"
        radius="lg"
        withBorder
        maw={920}
        w="100%"
        style={{ overflow: 'hidden' }}
      >
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={0}>
          <Stack
            p={{ base: 'lg', md: 'xl' }}
            gap={0}
            styles={{
              root: {
                'display': 'flex',
                'flexDirection': 'column',
                'justifyContent': 'center',
                'minHeight': '100%',
                '@media (max-width: 47.99em)': {
                  justifyContent: 'flex-start',
                },
              },
            }}
          >
            {children}
          </Stack>
          <Paper
            p={{ base: 'lg', md: 'xl' }}
            bg="var(--mantine-color-violet-0)"
            radius={0}
            styles={{
              root: {
                'borderTop': '1px solid var(--mantine-color-default-border)',
                '@media (min-width: 48em)': {
                  borderTop: 'none',
                  borderLeft: '1px solid var(--mantine-color-default-border)',
                },
              },
            }}
          >
            <AuthIntroPanel />
          </Paper>
        </SimpleGrid>
      </Paper>
    </Box>
  )
}
