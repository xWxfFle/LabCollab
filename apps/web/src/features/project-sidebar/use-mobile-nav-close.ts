import { use } from 'react'
import { MobileNavCloseContext } from './mobile-nav-close-context'

export function useMobileNavClose() {
  return use(MobileNavCloseContext)
}
