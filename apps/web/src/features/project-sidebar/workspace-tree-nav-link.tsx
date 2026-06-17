import type { Route } from '@argon-router/core'
import type { ReactNode } from 'react'
import { useLink, useRouter } from '@argon-router/react'
import { NavLink } from '@mantine/core'
import { workspaceTreeNavLinkProps } from './workspace-tree-icons'

interface WorkspaceTreeNavLinkProps<Params extends object | void = void> {
  route: Route<Params>
  params?: Params extends void | undefined ? never : Params
  label: ReactNode
  leftSection: ReactNode
  rightSection?: ReactNode
  active: boolean
}

export function WorkspaceTreeNavLink<Params extends object | void = void>({
  route,
  params,
  label,
  leftSection,
  rightSection,
  active,
}: WorkspaceTreeNavLinkProps<Params>) {
  const { path } = useLink(route, params as never)
  const { onNavigate } = useRouter()

  return (
    <NavLink
      {...workspaceTreeNavLinkProps}
      href={path}
      label={label}
      leftSection={leftSection}
      rightSection={rightSection}
      active={active}
      variant={active ? 'light' : 'subtle'}
      noWrap
      onClick={(event) => {
        if (
          event.defaultPrevented
          || event.metaKey
          || event.altKey
          || event.ctrlKey
          || event.shiftKey
        ) {
          return
        }
        event.preventDefault()
        onNavigate({ path, query: {} })
      }}
    />
  )
}
