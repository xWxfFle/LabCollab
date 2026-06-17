import type { ReactNode } from 'react'
import { createTheme, MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/tiptap/styles.css'

const theme = createTheme({
  primaryColor: 'violet',
  primaryShade: { light: 6, dark: 8 },
  defaultRadius: 'md',
  fontFamily: 'Lato, sans-serif',
  fontFamilyMonospace: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  headings: { fontFamily: 'Lato, sans-serif', fontWeight: '700' },
})

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications position="top-right" />
      {children}
    </MantineProvider>
  )
}
