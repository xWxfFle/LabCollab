import type { Route } from '@argon-router/core'
import { debounce } from 'patronum'

/** Схлопывает двойной `opened` argon-router за одну навигацию. */
export function debouncedRouteOpened<T extends object | void = void>(route: Route<T>) {
  return debounce({
    source: route.opened,
    timeout: 0,
  })
}
