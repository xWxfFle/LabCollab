import type { Route } from '@argon-router/core'
import { chainRoute } from '@argon-router/core'
import { createEvent, sample } from 'effector'
import { previous } from 'patronum'
import { viewerQuery } from '../api/auth'
import { noop } from '../lib'
import { routes } from '../routing'
import { $viewerStatus } from './model'

const $viewerStatusBeforeUpdate = previous($viewerStatus)

export function chainAuthenticated<T extends object | void = void>(route: Route<T>) {
  const authenticationCheckStarted = createEvent()
  const userAuthenticated = createEvent()
  const userAnonymous = createEvent()

  sample({
    clock: authenticationCheckStarted,
    source: $viewerStatus,
    filter: status => status === 'Initial',
    fn: noop,
    target: viewerQuery.start,
  })

  sample({
    clock: authenticationCheckStarted,
    source: $viewerStatus,
    filter: status => status === 'Authenticated',
    target: userAuthenticated,
  })

  sample({
    clock: viewerQuery.finished.success,
    source: {
      prevStatus: $viewerStatusBeforeUpdate,
      status: $viewerStatus,
      isOpened: route.$isOpened,
    },
    filter: ({ prevStatus, status, isOpened }) =>
      isOpened
      && status === 'Authenticated'
      && (prevStatus === 'Pending' || prevStatus === 'Initial'),
    target: userAuthenticated,
  })

  sample({
    clock: [authenticationCheckStarted, viewerQuery.finished.failure],
    source: $viewerStatus,
    filter: status => status === 'Anonymous',
    target: userAnonymous,
  })

  const chain = chainRoute<T>({
    route,
    beforeOpen: authenticationCheckStarted as never,
    openOn: userAuthenticated,
    cancelOn: userAnonymous,
  })

  sample({
    clock: chain.cancelled,
    filter: route.$isOpened,
    fn: () => ({ query: {} }),
    target: routes.login.open,
  })

  return chain
}

export function chainAnonymous<T extends object | void = void>(route: Route<T>) {
  const authenticationCheckStarted = createEvent()
  const userAuthenticated = createEvent()
  const userAnonymous = createEvent()

  sample({
    clock: authenticationCheckStarted,
    source: $viewerStatus,
    filter: status => status === 'Initial',
    fn: noop,
    target: viewerQuery.start,
  })

  sample({
    clock: [authenticationCheckStarted, viewerQuery.finished.success],
    source: $viewerStatus,
    filter: status => status === 'Authenticated',
    target: userAuthenticated,
  })

  sample({
    clock: [authenticationCheckStarted, viewerQuery.finished.finally],
    source: $viewerStatus,
    filter: status => status === 'Anonymous',
    target: userAnonymous,
  })

  const chain = chainRoute<T>({
    route,
    beforeOpen: authenticationCheckStarted as never,
    openOn: userAnonymous,
    cancelOn: userAuthenticated,
  })

  sample({
    clock: chain.cancelled,
    filter: route.$isOpened,
    fn: () => ({ query: {} }),
    target: routes.dashboard.open,
  })

  return chain
}
