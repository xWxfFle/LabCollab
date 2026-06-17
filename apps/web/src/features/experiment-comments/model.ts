import { createEvent, sample } from 'effector'
import { commentsQuery, createCommentMutation } from '@/shared/api'
import { debouncedRouteOpened, routes } from '@/shared/routing'

const currentRoute = routes.experimentView
const routeOpened = debouncedRouteOpened(currentRoute)

export const commentSubmitted = createEvent<string>()

sample({
  clock: routeOpened,
  fn: ({ params }) => ({ experimentId: params.experimentId }),
  target: commentsQuery.start,
})

sample({
  clock: commentSubmitted,
  source: currentRoute.$params,
  fn: (params, body) => ({
    experimentId: params.experimentId,
    body,
  }),
  target: createCommentMutation.start,
})

sample({
  clock: createCommentMutation.finished.success,
  source: currentRoute.$params,
  fn: params => ({ experimentId: params.experimentId }),
  target: commentsQuery.start,
})
