import type { ExperimentStatus, WorkspaceNodeDto } from '@labcollab/shared'

function matchesTagFilter(tags: string[] | null | undefined, tagFilter: string) {
  const needle = tagFilter.trim().toLowerCase()
  if (!needle)
    return true
  return (tags ?? []).some(tag => tag.toLowerCase() === needle)
}

export function filterWorkspaceTree(
  nodes: WorkspaceNodeDto[],
  statusFilter: ExperimentStatus | 'all',
  tagFilter: string | null,
): WorkspaceNodeDto[] {
  const result: WorkspaceNodeDto[] = []

  for (const node of nodes) {
    if (node.type === 'folder') {
      const children = filterWorkspaceTree(node.children, statusFilter, tagFilter)
      result.push({ ...node, children })
      continue
    }

    if (node.type === 'experiment') {
      if (statusFilter !== 'all' && node.experimentStatus !== statusFilter)
        continue
      if (!matchesTagFilter(node.experimentTags, tagFilter ?? ''))
        continue
      result.push({ ...node, children: [] })
      continue
    }

    result.push({ ...node, children: [] })
  }

  return result
}

export function collectExperimentTags(nodes: WorkspaceNodeDto[]): string[] {
  const tags = new Set<string>()

  const walk = (list: WorkspaceNodeDto[]) => {
    for (const node of list) {
      if (node.type === 'experiment') {
        for (const tag of node.experimentTags ?? [])
          tags.add(tag)
      }
      if (node.children.length > 0)
        walk(node.children)
    }
  }

  walk(nodes)
  return [...tags].sort((a, b) => a.localeCompare(b, 'ru'))
}

export function collectCollapsedKey(projectId: string) {
  return `labcollab:collapsed:${projectId}`
}

export interface FolderOption {
  id: string
  title: string
  depth: number
}

export function collectFolders(
  nodes: WorkspaceNodeDto[],
  depth = 0,
  acc: FolderOption[] = [],
): FolderOption[] {
  for (const node of nodes) {
    if (node.type === 'folder') {
      acc.push({ id: node.id, title: node.title, depth })
      collectFolders(node.children, depth + 1, acc)
    }
  }
  return acc
}

export function isDescendantFolder(
  nodes: WorkspaceNodeDto[],
  folderId: string,
  candidateParentId: string,
): boolean {
  const findNode = (list: WorkspaceNodeDto[], id: string): WorkspaceNodeDto | null => {
    for (const node of list) {
      if (node.id === id)
        return node
      const found = findNode(node.children, id)
      if (found)
        return found
    }
    return null
  }

  const folder = findNode(nodes, folderId)
  if (!folder)
    return false

  const walk = (list: WorkspaceNodeDto[]): boolean => {
    for (const node of list) {
      if (node.id === candidateParentId)
        return true
      if (walk(node.children))
        return true
    }
    return false
  }

  return walk(folder.children)
}

export function readCollapsedFolders(projectId: string): Set<string> {
  try {
    const raw = localStorage.getItem(collectCollapsedKey(projectId))
    if (!raw)
      return new Set()
    return new Set(JSON.parse(raw) as string[])
  }
  catch {
    return new Set()
  }
}

export function writeCollapsedFolders(projectId: string, ids: Set<string>) {
  localStorage.setItem(collectCollapsedKey(projectId), JSON.stringify([...ids]))
}
