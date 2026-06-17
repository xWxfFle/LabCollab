import { createContext } from 'react'

export const MobileNavCloseContext = createContext<(() => void) | undefined>(undefined)
