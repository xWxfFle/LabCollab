import type { ReactNode } from 'react'
import { Tabs } from '@mantine/core'

export type AuthFormTab = 'login' | 'register'

interface AuthFormTabsProps {
  value: AuthFormTab
  onChange: (value: AuthFormTab) => void
  loginPanel: ReactNode
  registerPanel: ReactNode
}

export function AuthFormTabs({
  value,
  onChange,
  loginPanel,
  registerPanel,
}: AuthFormTabsProps) {
  return (
    <Tabs
      value={value}
      onChange={next => next && onChange(next as AuthFormTab)}
      variant="pills"
      radius="sm"
      color="violet"
      keepMounted={false}
      styles={{
        list: {
          backgroundColor: 'var(--mantine-color-gray-1)',
          padding: 3,
          gap: 3,
          borderRadius: 'var(--mantine-radius-md)',
          minHeight: 'unset',
        },
        tab: {
          flex: 1,
          fontWeight: 600,
          fontSize: 'var(--mantine-font-size-sm)',
          height: 32,
          minHeight: 32,
          paddingInline: 'var(--mantine-spacing-sm)',
          paddingBlock: 0,
          lineHeight: 1,
          transition: 'background-color 150ms ease, color 150ms ease',
        },
        panel: {
          paddingTop: 'var(--mantine-spacing-md)',
        },
      }}
    >
      <Tabs.List grow>
        <Tabs.Tab value="login">Вход</Tabs.Tab>
        <Tabs.Tab value="register">Регистрация</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="login">{loginPanel}</Tabs.Panel>
      <Tabs.Panel value="register">{registerPanel}</Tabs.Panel>
    </Tabs>
  )
}
