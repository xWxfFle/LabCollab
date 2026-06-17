import type { WorkspaceNodeDto } from '@labcollab/shared'
import { and, asc, eq, isNull } from 'drizzle-orm'
import { db } from '../db'
import { experiments, projectNodes, projectPages } from '../db/schema'

type NodeRow = typeof projectNodes.$inferSelect & {
  pageId: string | null
  experimentStatus: typeof experiments.$inferSelect.status | null
  experimentTags: string[] | null
}

export async function loadProjectNodes(projectId: string): Promise<NodeRow[]> {
  const rows = await db
    .select({
      node: projectNodes,
      pageId: projectPages.id,
      experimentStatus: experiments.status,
      experimentTags: experiments.tags,
    })
    .from(projectNodes)
    .leftJoin(projectPages, eq(projectPages.nodeId, projectNodes.id))
    .leftJoin(experiments, eq(experiments.id, projectNodes.experimentId))
    .where(eq(projectNodes.projectId, projectId))
    .orderBy(asc(projectNodes.sortOrder), asc(projectNodes.createdAt))

  return rows.map(({ node, pageId, experimentStatus, experimentTags }) => ({
    ...node,
    pageId: pageId ?? null,
    experimentStatus: experimentStatus ?? null,
    experimentTags: experimentTags ?? null,
  }))
}

export function buildWorkspaceTree(rows: NodeRow[]): WorkspaceNodeDto[] {
  const byParent = new Map<string | null, NodeRow[]>()

  for (const row of rows) {
    const key = row.parentId ?? null
    const list = byParent.get(key) ?? []
    list.push(row)
    byParent.set(key, list)
  }

  const toDto = (row: NodeRow): WorkspaceNodeDto => ({
    id: row.id,
    projectId: row.projectId,
    parentId: row.parentId,
    type: row.nodeType,
    title: row.title,
    sortOrder: row.sortOrder,
    pageId: row.pageId,
    experimentId: row.experimentId,
    experimentStatus: row.experimentStatus,
    experimentTags: row.nodeType === 'experiment' ? (row.experimentTags ?? []) : null,
    children: (byParent.get(row.id) ?? []).map(toDto),
  })

  return (byParent.get(null) ?? []).map(toDto)
}

export async function getWorkspaceTree(projectId: string): Promise<WorkspaceNodeDto[]> {
  const rows = await loadProjectNodes(projectId)
  return buildWorkspaceTree(rows)
}

export async function getNodeById(nodeId: string) {
  const [row] = await db
    .select()
    .from(projectNodes)
    .where(eq(projectNodes.id, nodeId))
    .limit(1)
  return row ?? null
}

export async function assertFolderParent(
  projectId: string,
  parentId: string | null | undefined,
): Promise<{ ok: true } | { ok: false, status: number, error: string }> {
  if (!parentId)
    return { ok: true }

  const parent = await getNodeById(parentId)
  if (!parent || parent.projectId !== projectId) {
    return { ok: false, status: 404, error: 'Parent not found' }
  }
  if (parent.nodeType !== 'folder') {
    return { ok: false, status: 422, error: 'Parent must be a folder' }
  }
  return { ok: true }
}

export async function nextSortOrder(projectId: string, parentId: string | null) {
  const rows = await db
    .select({ sortOrder: projectNodes.sortOrder })
    .from(projectNodes)
    .where(
      and(
        eq(projectNodes.projectId, projectId),
        parentId ? eq(projectNodes.parentId, parentId) : isNull(projectNodes.parentId),
      ),
    )

  if (rows.length === 0)
    return 0
  return Math.max(...rows.map(r => r.sortOrder)) + 1
}

export async function syncExperimentNodeTitle(experimentId: string, title: string) {
  await db
    .update(projectNodes)
    .set({ title, updatedAt: new Date() })
    .where(eq(projectNodes.experimentId, experimentId))
}

export async function createExperimentNode(params: {
  projectId: string
  experimentId: string
  title: string
  authorId: string
  parentNodeId?: string | null
}) {
  const parentCheck = await assertFolderParent(params.projectId, params.parentNodeId)
  if (!parentCheck.ok)
    throw new Error(parentCheck.error)

  const sortOrder = await nextSortOrder(params.projectId, params.parentNodeId ?? null)

  const [node] = await db
    .insert(projectNodes)
    .values({
      projectId: params.projectId,
      parentId: params.parentNodeId ?? null,
      nodeType: 'experiment',
      title: params.title,
      sortOrder,
      experimentId: params.experimentId,
      authorId: params.authorId,
    })
    .returning()

  return node
}
