import type { Query, Route } from '@argon-router/core'
import type { MouseEvent, ReactNode } from 'react'
import { useLink, useRouter } from '@argon-router/react'
import { Box, NavLink } from '@mantine/core'
import { useUnit } from 'effector-react'
import { $workspaceFiltersQuery } from './model'
import { useMobileNavClose } from './use-mobile-nav-close'
import { workspaceTreeNavLinkProps } from './workspace-tree-icons'

interface WorkspaceTreeNavLinkProps<Params extends object | void = void> {
  route: Route<Params>
  params?: Params extends void | undefined ? never : Params
  label: ReactNode
  leftSection: ReactNode
  rightSection?: ReactNode
  active: boolean
}

function navigateFromTreeLink(
  event: MouseEvent,
  active: boolean,
  path: string,
  query: Query,
  onNavigate: ReturnType<typeof useRouter>['onNavigate'],
  onAfterNavigate?: () => void,
) {
  if (
    active
    || event.defaultPrevented
    || event.metaKey
    || event.altKey
    || event.ctrlKey
    || event.shiftKey
  ) {
    event.preventDefault()
    return
  }
  event.preventDefault()
  onNavigate({ path, query })
  onAfterNavigate?.()
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
  const workspaceQuery = useUnit($workspaceFiltersQuery)
  const closeMobileNav = useMobileNavClose()

  const link = (
    <NavLink
      {...workspaceTreeNavLinkProps}
      href={path}
      label={label}
      leftSection={leftSection}
      active={active}
      variant={active ? 'light' : 'subtle'}
      noWrap
      onClick={event =>
        navigateFromTreeLink(event, active, path, workspaceQuery, onNavigate, closeMobileNav)}
      style={rightSection ? { flex: 1, minWidth: 0 } : undefined}
      styles={
        rightSection
          ? {
              root: {
                ...workspaceTreeNavLinkProps.styles?.root,
                flex: 1,
                minWidth: 0,
                backgroundColor: 'transparent',
              },
            }
          : workspaceTreeNavLinkProps.styles
      }
    />
  )

  if (!rightSection)
    return link

  return (
    <Box
      style={{
        display: 'flex',
        alignItems: 'stretch',
        width: '100%',
        borderRadius: 'var(--mantine-radius-default)',
        backgroundColor: active ? 'var(--mantine-color-violet-light)' : undefined,
      }}
    >
      {link}
      <Box
        style={{
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
          paddingRight: 'var(--mantine-spacing-sm)',
        }}
      >
        {rightSection}
      </Box>
    </Box>
  )
}
