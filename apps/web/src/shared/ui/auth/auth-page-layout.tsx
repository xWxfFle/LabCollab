import type { ReactNode } from 'react'
import { Anchor, Box, Paper, SimpleGrid, Stack, Text } from '@mantine/core'
import { AuthIntroPanel } from './auth-intro-panel'
import classes from './auth-page-layout.module.css'

const supportTelegramUrl = 'https://t.me/xWxfFle'

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
            className={classes.formPanel}
            p={{ base: 'lg', md: 'xl' }}
            gap={0}
          >
            <Box className={classes.formContent}>
              {children}
            </Box>
            <Text size="xs" c="dimmed" ta="center" mt="auto" pt="xl">
              По вопросам поддержки или сотрудничества:
              {' '}
              <Anchor href={supportTelegramUrl} target="_blank" rel="noopener noreferrer">
                @xWxfFle
              </Anchor>
            </Text>
          </Stack>
          <Paper
            className={classes.introPanel}
            p={{ base: 'lg', md: 'xl' }}
            bg="var(--mantine-color-violet-0)"
            radius={0}
          >
            <AuthIntroPanel />
          </Paper>
        </SimpleGrid>
      </Paper>
    </Box>
  )
}
