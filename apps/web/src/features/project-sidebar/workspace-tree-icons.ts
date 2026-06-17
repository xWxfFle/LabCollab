import type { NavLinkProps } from '@mantine/core'

export const treeIconProps = { size: 16, stroke: 1.5 } as const

/** Общий вид пунктов дерева workspace (скругление фона active/hover). */
export const workspaceTreeNavLinkProps = {
  styles: {
    root: {
      borderRadius: 'var(--mantine-radius-default)',
    },
  },
} satisfies Pick<NavLinkProps, 'styles'>
