import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/tiptap/styles.css';
import type { ReactNode } from 'react';

const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'system-ui, -apple-system, sans-serif',
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications position="top-right" />
      {children}
    </MantineProvider>
  );
}
