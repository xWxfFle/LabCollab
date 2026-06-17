import { createForm } from '@effector-reform/core'
import { zodAdapter } from '@effector-reform/zod'
import { loginSchema, registerSchema } from '@labcollab/shared'
import { createEvent, restore, sample } from 'effector'
import { loginMutation, registerMutation } from '@/shared/api'
import { debouncedRouteOpened, routes } from '@/shared/routing'
import { chainAnonymous, tokenSet, viewerAuthenticated } from '@/shared/viewer'

export type AuthTab = 'login' | 'register'

export const loginRoute = routes.login
export const registerRoute = routes.register

export const currentRoute = loginRoute
export const anonymousRoute = chainAnonymous(loginRoute)
export const registerAnonymousRoute = chainAnonymous(registerRoute)

export const routeOpened = debouncedRouteOpened(loginRoute)

export const authTabChanged = createEvent<AuthTab>()
export const $authTab = restore(authTabChanged, 'login')

sample({
  clock: loginRoute.opened,
  fn: () => 'login' as const,
  target: authTabChanged,
})

sample({
  clock: registerRoute.opened,
  fn: () => 'register' as const,
  target: authTabChanged,
})

export const loginForm = createForm({
  schema: {
    email: 'alice@lab.local',
    password: 'password123',
  },
  validation: zodAdapter(loginSchema),
})

export const registerForm = createForm({
  schema: {
    displayName: '',
    email: '',
    password: '',
  },
  validation: zodAdapter(registerSchema),
})

sample({
  clock: loginForm.validatedAndSubmitted,
  target: loginMutation.start,
})

sample({
  clock: registerForm.validatedAndSubmitted,
  target: registerMutation.start,
})

sample({
  clock: loginMutation.finished.success,
  fn: ({ result }) => result.accessToken,
  target: tokenSet,
})

sample({
  clock: registerMutation.finished.success,
  fn: ({ result }) => result.accessToken,
  target: tokenSet,
})

sample({
  clock: loginMutation.finished.success,
  fn: ({ result }) => result.user,
  target: viewerAuthenticated,
})

sample({
  clock: registerMutation.finished.success,
  fn: ({ result }) => result.user,
  target: viewerAuthenticated,
})

sample({
  clock: [loginMutation.finished.success, registerMutation.finished.success],
  fn: () => ({ query: {} }),
  target: routes.dashboard.open,
})

sample({
  clock: loginMutation.finished.failure,
  fn: () => ({
    errors: {
      email: 'Неверные данные для входа',
      password: 'Неверные данные для входа',
    },
  }),
  target: loginForm.fill,
})

sample({
  clock: registerMutation.finished.failure,
  fn: () => ({
    errors: {
      email: 'Ошибка регистрации',
    },
  }),
  target: registerForm.fill,
})

sample({
  clock: loginRoute.closed,
  target: loginForm.reset,
})

sample({
  clock: registerRoute.closed,
  target: registerForm.reset,
})

export { loginMutation, registerMutation }
