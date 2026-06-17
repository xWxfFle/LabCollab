import { useUnit } from 'effector-react'
import { useEffect } from 'react'
import { router, routes } from '@/shared/routing'
import { PageLoader } from '@/shared/ui/placeholders'

export function RouteOtherwise() {
  const activeRoutes = useUnit(router.$activeRoutes)

  useEffect(() => {
    if (activeRoutes.length === 0)
      routes.dashboard.open()
  }, [activeRoutes.length])

  return <PageLoader />
}
