import { createRouter, createRouterControls, historyAdapter } from '@argon-router/core'
import { sample } from 'effector'
import { createBrowserHistory } from 'history'
import { appStarted } from '../init'
import { routes } from './routes'

export const controls = createRouterControls()

const history = createBrowserHistory()

export const router = createRouter({
  base: import.meta.env.BASE_URL,
  routes: Object.values(routes),
  controls,
})

sample({
  clock: appStarted,
  fn: () => historyAdapter(history),
  target: [router.setHistory, controls.setHistory],
})
