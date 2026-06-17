import { createForm } from '@effector-reform/core'
import { zodAdapter } from '@effector-reform/zod'
import { createProjectSchema } from '@labcollab/shared'
import { createEvent, createStore, sample } from 'effector'
import { reset } from 'patronum'
import { createProjectMutation, projectsQuery } from '@/shared/api'
import { debouncedRouteOpened, routes } from '@/shared/routing'
import { chainAuthenticated } from '@/shared/viewer'

export const currentRoute = routes.dashboard
export const authenticatedRoute = chainAuthenticated(currentRoute)
export const routeOpened = debouncedRouteOpened(currentRoute)

export const createModalOpened = createEvent()
export const createModalClosed = createEvent()

export const $createModalOpened = createStore(false)
  .on(createModalOpened, () => true)
  .reset(createModalClosed)

export const createFormModel = createForm({
  schema: {
    name: '',
    description: '',
  },
  validation: zodAdapter(createProjectSchema),
})

sample({
  clock: routeOpened,
  target: projectsQuery.start,
})

sample({
  clock: createFormModel.validatedAndSubmitted,
  fn: ({ name, description }) => ({
    name,
    description: description || undefined,
  }),
  target: createProjectMutation.start,
})

sample({
  clock: createProjectMutation.finished.success,
  target: [createModalClosed, projectsQuery.start],
})

sample({
  clock: currentRoute.closed,
  target: createFormModel.reset,
})

reset({
  clock: currentRoute.closed,
  target: $createModalOpened,
})

export { createProjectMutation, projectsQuery }
