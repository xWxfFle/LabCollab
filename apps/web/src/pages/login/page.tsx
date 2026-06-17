import { useForm } from '@effector-reform/react'
import { useLink, useRouter } from '@argon-router/react'
import {
  Alert,
  Button,
  PasswordInput,
  Stack,
  TextInput,
} from '@mantine/core'
import { useUnit } from 'effector-react'
import { routes } from '@/shared/routing'
import { AuthFormTabs, AuthPageLayout } from '@/shared/ui/auth'
import type { AuthTab } from './model'
import {
  $authTab,
  authTabChanged,
  loginForm,
  loginMutation,
  registerForm,
  registerMutation,
} from './model'

function LoginForm() {
  const { fields, onSubmit, errors } = useForm(loginForm)
  const pending = useUnit(loginMutation.$pending)
  const errorMessage
    = typeof errors.email === 'string'
      ? errors.email
      : typeof errors.password === 'string'
        ? errors.password
        : null

  return (
    <form onSubmit={onSubmit}>
      <Stack>
        {errorMessage && <Alert color="red">{errorMessage}</Alert>}
        <TextInput
          label="Email"
          value={fields.email.value}
          onChange={e => fields.email.onChange(e.currentTarget.value)}
          onBlur={fields.email.onBlur}
          error={typeof errors.email === 'string' ? errors.email : undefined}
          required
        />
        <PasswordInput
          label="Пароль"
          value={fields.password.value}
          onChange={e => fields.password.onChange(e.currentTarget.value)}
          onBlur={fields.password.onBlur}
          error={typeof errors.password === 'string' ? errors.password : undefined}
          required
        />
        <Button type="submit" loading={pending}>
          Войти
        </Button>
      </Stack>
    </form>
  )
}

function RegisterForm() {
  const { fields, onSubmit, errors } = useForm(registerForm)
  const pending = useUnit(registerMutation.$pending)
  const errorMessage = typeof errors.email === 'string' ? errors.email : null

  return (
    <form onSubmit={onSubmit}>
      <Stack>
        {errorMessage && <Alert color="red">{errorMessage}</Alert>}
        <TextInput
          label="Имя"
          value={fields.displayName.value}
          onChange={e => fields.displayName.onChange(e.currentTarget.value)}
          onBlur={fields.displayName.onBlur}
          error={typeof errors.displayName === 'string' ? errors.displayName : undefined}
          required
        />
        <TextInput
          label="Email"
          value={fields.email.value}
          onChange={e => fields.email.onChange(e.currentTarget.value)}
          onBlur={fields.email.onBlur}
          error={typeof errors.email === 'string' ? errors.email : undefined}
          required
        />
        <PasswordInput
          label="Пароль"
          value={fields.password.value}
          onChange={e => fields.password.onChange(e.currentTarget.value)}
          onBlur={fields.password.onBlur}
          error={typeof errors.password === 'string' ? errors.password : undefined}
          required
        />
        <Button type="submit" loading={pending}>
          Создать аккаунт
        </Button>
      </Stack>
    </form>
  )
}

export default function LoginPage() {
  const authTab = useUnit($authTab)
  const changeAuthTab = useUnit(authTabChanged)
  const loginLink = useLink(routes.login)
  const registerLink = useLink(routes.register)
  const { onNavigate } = useRouter()

  const handleTabChange = (tab: AuthTab) => {
    if (tab === authTab)
      return

    changeAuthTab(tab)
    onNavigate({
      path: tab === 'register' ? registerLink.path : loginLink.path,
      query: {},
    })
  }

  return (
    <AuthPageLayout>
      <AuthFormTabs
        value={authTab}
        onChange={handleTabChange}
        loginPanel={<LoginForm />}
        registerPanel={<RegisterForm />}
      />
    </AuthPageLayout>
  )
}
