import type { ReactNode } from 'react'
import { MobileNavCloseContext } from './mobile-nav-close-context'

export function MobileNavCloseProvider({
  onClose,
  children,
}: {
  onClose: () => void
  children: ReactNode
}) {
  return (
    <MobileNavCloseContext value={onClose}>
      {children}
    </MobileNavCloseContext>
  )
}
