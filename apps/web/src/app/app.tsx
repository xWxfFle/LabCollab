import { RouterProvider } from '@argon-router/react'
import { router } from '@/shared/routing'
import { Pages } from '../pages'
import { Providers } from './providers'

export function App() {
  return (
    <Providers>
      <RouterProvider router={router}>
        <Pages />
      </RouterProvider>
    </Providers>
  )
}
