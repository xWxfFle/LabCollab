import type { UserDto } from '@labcollab/shared'
import { createEvent, createStore, sample } from 'effector'
import { viewerQuery } from '../api/auth'
import { TOKEN_KEY } from '../api/base'
import { sessionUnauthorized } from '../api/unauthorized'
import { appStarted } from '../init'
import { routes } from '../routing'

export type ViewerStatus = 'Initial' | 'Pending' | 'Authenticated' | 'Anonymous'

function readStoredToken() {
  return typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null
}

function hasStoredToken() {
  return Boolean(readStoredToken())
}

export const tokenSet = createEvent<string>()
export const viewerAuthenticated = createEvent<UserDto>()
export const viewerSignedOut = createEvent()
export const signedOut = createEvent()

export const $token = createStore<string | null>(readStoredToken())
export const $viewer = createStore<UserDto | null>(null)
export const $viewerStatus = createStore<ViewerStatus>(hasStoredToken() ? 'Initial' : 'Anonymous')

sample({
  clock: tokenSet,
  fn: (token) => {
    localStorage.setItem(TOKEN_KEY, token)
    return token
  },
  target: $token,
})

sample({
  clock: viewerSignedOut,
  fn: () => {
    localStorage.removeItem(TOKEN_KEY)
    return null
  },
  target: $token,
})

sample({
  clock: viewerQuery.finished.success,
  fn: ({ result }) => (result as { user: UserDto }).user,
  target: $viewer,
})

sample({
  clock: viewerAuthenticated,
  target: $viewer,
})

sample({
  clock: viewerSignedOut,
  fn: () => null,
  target: $viewer,
})

sample({
  clock: viewerQuery.$pending,
  source: $viewerStatus,
  filter: (status, pending) => pending && status === 'Initial',
  fn: () => 'Pending' as ViewerStatus,
  target: $viewerStatus,
})

sample({
  clock: viewerQuery.finished.success,
  fn: () => 'Authenticated' as ViewerStatus,
  target: $viewerStatus,
})

sample({
  clock: viewerAuthenticated,
  fn: () => 'Authenticated' as ViewerStatus,
  target: $viewerStatus,
})

sample({
  clock: viewerQuery.finished.failure,
  source: $viewerStatus,
  filter: status => status === 'Pending' || status === 'Initial',
  fn: () => 'Anonymous' as ViewerStatus,
  target: $viewerStatus,
})

sample({
  clock: viewerSignedOut,
  fn: () => 'Anonymous' as ViewerStatus,
  target: $viewerStatus,
})

sample({
  clock: appStarted,
  source: $token,
  filter: Boolean,
  target: viewerQuery.start,
})

sample({
  clock: sessionUnauthorized,
  target: signedOut,
})

sample({
  clock: signedOut,
  target: viewerSignedOut,
})

sample({
  clock: viewerSignedOut,
  fn: () => ({ query: {} }),
  target: routes.login.open,
})

export { viewerQuery }
