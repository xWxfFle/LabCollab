import type { Editor } from '@tiptap/react'
import { useRouter } from '@argon-router/react'

export function handleInternalLinkClick(event: MouseEvent, onNavigate: (path: string) => void) {
  const target = event.target as HTMLElement | null
  const anchor = target?.closest('a')
  if (!anchor)
    return false

  const href = anchor.getAttribute('href')
  if (!href || !href.startsWith('/projects/'))
    return false

  event.preventDefault()
  onNavigate(href)
  return true
}

export function useInternalLinkNavigation() {
  const { onNavigate } = useRouter()

  return (path: string) => onNavigate({ path, query: {} })
}

export function insertInternalLink(editor: Editor, href: string, label: string) {
  const safeLabel = label.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  editor
    .chain()
    .focus()
    .insertContent(`<a href="${href}" data-labcollab-internal="true">${safeLabel}</a>`)
    .run()
}
