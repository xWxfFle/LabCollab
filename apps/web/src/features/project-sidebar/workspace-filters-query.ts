import type { Query } from '@argon-router/core'
import type { ExperimentStatus } from '@labcollab/shared'

export interface WorkspaceFilters {
  status: ExperimentStatus | 'all'
  tag: string | null
  search: string
}

export const workspaceQueryKeys = {
  status: 'wsStatus',
  tag: 'wsTag',
  q: 'wsQ',
} as const

const statusValues = new Set<string>([
  'all',
  'draft',
  'in_progress',
  'completed_success',
  'completed_failure',
])

export function workspaceFiltersToQuery(filters: WorkspaceFilters): Query {
  const query: Query = {}

  if (filters.status !== 'all')
    query[workspaceQueryKeys.status] = filters.status

  if (filters.tag?.trim())
    query[workspaceQueryKeys.tag] = filters.tag.trim()

  if (filters.search.trim())
    query[workspaceQueryKeys.q] = filters.search.trim()

  return query
}

export function parseWorkspaceFiltersFromQuery(query?: Query): WorkspaceFilters {
  const statusRaw = query?.[workspaceQueryKeys.status]
  const status = typeof statusRaw === 'string' && statusValues.has(statusRaw)
    ? statusRaw as ExperimentStatus | 'all'
    : 'all'

  const tagRaw = query?.[workspaceQueryKeys.tag]
  const tag = typeof tagRaw === 'string' && tagRaw.trim() ? tagRaw : null

  const searchRaw = query?.[workspaceQueryKeys.q]
  const search = typeof searchRaw === 'string' ? searchRaw : ''

  return { status, tag, search }
}
