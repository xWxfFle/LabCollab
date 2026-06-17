import { useUnit } from 'effector-react'
import { useEffect } from 'react'
import { router, routes } from '@/shared/routing'
import { PageLoader } from '@/shared/ui/placeholders'

/** 404 / нет совпадения — редирект на dashboard. Не показывается при переходах внутри проекта. */
export function RouteOtherwise() {
  const activeRoutes = useUnit(router.$activeRoutes)

  useEffect(() => {
    if (activeRoutes.length === 0)
      routes.dashboard.open()
  }, [activeRoutes.length])

  return <PageLoader />
}
