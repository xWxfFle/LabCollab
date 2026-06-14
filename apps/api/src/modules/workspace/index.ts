import { and, desc, eq } from 'drizzle-orm';
import { Elysia } from 'elysia';
import { db } from '../../db';
import { experimentVersions, experiments, projectNodes, projectPages, projectPageVersions, users } from '../../db/schema';
import {
  createFolderSchema,
  createProjectPageSchema,
  moveWorkspaceNodeSchema,
  updateProjectPageSchema,
  updateWorkspaceNodeSchema,
  workspaceSearchQuerySchema,
} from '@labcollab/shared';
import { pageToSnapshot, toProjectPageDto } from '../../lib/page-mappers';
import { canEditProject, canReadProject } from '../../lib/rbac';
import { searchWorkspace } from '../../lib/workspace-search';
import {
  assertFolderParent,
  getNodeById,
  getWorkspaceTree,
  nextSortOrder,
} from '../../lib/workspace';
import { authGuard } from '../../plugins/auth-guard';

async function loadPageDto(pageId: string) {
  const [row] = await db
    .select({ page: projectPages, node: projectNodes })
    .from(projectPages)
    .innerJoin(projectNodes, eq(projectNodes.id, projectPages.nodeId))
    .where(eq(projectPages.id, pageId))
    .limit(1);

  if (!row) return null;
  return toProjectPageDto(row.page, row.node);
}

async function createPageSnapshot(pageId: string, userId: string) {
  const dto = await loadPageDto(pageId);
  if (!dto) return;

  await db.insert(projectPageVersions).values({
    pageId,
    createdBy: userId,
    snapshotJson: pageToSnapshot(dto),
  });
}

export const workspaceModule = new Elysia()
  .use(authGuard)
  .get('/projects/:id/workspace', async ({ userId, params, set }) => {
    if (!(await canReadProject(userId, params.id))) {
      set.status = 404;
      return { error: 'Not found' };
    }

    return getWorkspaceTree(params.id);
  })
  .get('/projects/:id/search', async ({ userId, params, query, set }) => {
    if (!(await canReadProject(userId, params.id))) {
      set.status = 404;
      return { error: 'Not found' };
    }

    const parsed = workspaceSearchQuerySchema.safeParse(query);
    if (!parsed.success) {
      set.status = 422;
      return { error: parsed.error.flatten() };
    }

    return searchWorkspace(params.id, parsed.data.q);
  })
  .post('/projects/:id/folders', async ({ userId, params, body, set }) => {
    if (!(await canEditProject(userId, params.id))) {
      set.status = 403;
      return { error: 'Forbidden' };
    }

    const parsed = createFolderSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 422;
      return { error: parsed.error.flatten() };
    }

    const parentCheck = await assertFolderParent(params.id, parsed.data.parentId);
    if (!parentCheck.ok) {
      set.status = parentCheck.status;
      return { error: parentCheck.error };
    }

    const sortOrder = await nextSortOrder(params.id, parsed.data.parentId ?? null);

    const [node] = await db
      .insert(projectNodes)
      .values({
        projectId: params.id,
        parentId: parsed.data.parentId ?? null,
        nodeType: 'folder',
        title: parsed.data.title,
        sortOrder,
        authorId: userId,
      })
      .returning();

    return {
      id: node.id,
      projectId: node.projectId,
      parentId: node.parentId,
      type: node.nodeType,
      title: node.title,
      sortOrder: node.sortOrder,
      pageId: null,
      experimentId: null,
      experimentStatus: null,
      children: [],
    };
  })
  .post('/projects/:id/pages', async ({ userId, params, body, set }) => {
    if (!(await canEditProject(userId, params.id))) {
      set.status = 403;
      return { error: 'Forbidden' };
    }

    const parsed = createProjectPageSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 422;
      return { error: parsed.error.flatten() };
    }

    const parentCheck = await assertFolderParent(params.id, parsed.data.parentId);
    if (!parentCheck.ok) {
      set.status = parentCheck.status;
      return { error: parentCheck.error };
    }

    const sortOrder = await nextSortOrder(params.id, parsed.data.parentId ?? null);

    const result = await db.transaction(async (tx) => {
      const [node] = await tx
        .insert(projectNodes)
        .values({
          projectId: params.id,
          parentId: parsed.data.parentId ?? null,
          nodeType: 'page',
          title: parsed.data.title,
          sortOrder,
          authorId: userId,
        })
        .returning();

      const [page] = await tx
        .insert(projectPages)
        .values({
          nodeId: node.id,
          projectId: params.id,
          bodyHtml: '',
        })
        .returning();

      return { node, page };
    });

    await createPageSnapshot(result.page.id, userId);

    return toProjectPageDto(result.page, result.node);
  })
  .patch('/workspace/nodes/:id', async ({ userId, params, body, set }) => {
    const node = await getNodeById(params.id);
    if (!node) {
      set.status = 404;
      return { error: 'Not found' };
    }

    if (!(await canEditProject(userId, node.projectId))) {
      set.status = 403;
      return { error: 'Forbidden' };
    }

    if (node.nodeType === 'experiment') {
      set.status = 422;
      return { error: 'Rename experiment via experiment API' };
    }

    const parsed = updateWorkspaceNodeSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 422;
      return { error: parsed.error.flatten() };
    }

    if (!parsed.data.title) {
      set.status = 422;
      return { error: 'Nothing to update' };
    }

    const [updated] = await db
      .update(projectNodes)
      .set({ title: parsed.data.title, updatedAt: new Date() })
      .where(eq(projectNodes.id, params.id))
      .returning();

    return {
      id: updated.id,
      title: updated.title,
    };
  })
  .patch('/workspace/nodes/:id/move', async ({ userId, params, body, set }) => {
    const node = await getNodeById(params.id);
    if (!node) {
      set.status = 404;
      return { error: 'Not found' };
    }

    if (!(await canEditProject(userId, node.projectId))) {
      set.status = 403;
      return { error: 'Forbidden' };
    }

    const parsed = moveWorkspaceNodeSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 422;
      return { error: parsed.error.flatten() };
    }

    if (parsed.data.parentId === params.id) {
      set.status = 422;
      return { error: 'Cannot move node into itself' };
    }

    const parentCheck = await assertFolderParent(node.projectId, parsed.data.parentId);
    if (!parentCheck.ok) {
      set.status = parentCheck.status;
      return { error: parentCheck.error };
    }

    const [updated] = await db
      .update(projectNodes)
      .set({
        parentId: parsed.data.parentId,
        sortOrder: parsed.data.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(projectNodes.id, params.id))
      .returning();

    return {
      id: updated.id,
      parentId: updated.parentId,
      sortOrder: updated.sortOrder,
    };
  })
  .delete('/workspace/nodes/:id', async ({ userId, params, set }) => {
    const node = await getNodeById(params.id);
    if (!node) {
      set.status = 404;
      return { error: 'Not found' };
    }

    if (!(await canEditProject(userId, node.projectId))) {
      set.status = 403;
      return { error: 'Forbidden' };
    }

    if (node.nodeType === 'experiment') {
      set.status = 422;
      return { error: 'Cannot delete experiment node' };
    }

    if (node.nodeType === 'folder') {
      const [child] = await db
        .select({ id: projectNodes.id })
        .from(projectNodes)
        .where(eq(projectNodes.parentId, params.id))
        .limit(1);

      if (child) {
        set.status = 422;
        return { error: 'Folder is not empty' };
      }
    }

    await db.delete(projectNodes).where(eq(projectNodes.id, params.id));
    return { ok: true };
  })
  .get('/pages/:id', async ({ userId, params, set }) => {
    const dto = await loadPageDto(params.id);
    if (!dto) {
      set.status = 404;
      return { error: 'Not found' };
    }

    if (!(await canReadProject(userId, dto.projectId))) {
      set.status = 404;
      return { error: 'Not found' };
    }

    return dto;
  })
  .patch('/pages/:id', async ({ userId, params, body, set }) => {
    const existing = await loadPageDto(params.id);
    if (!existing) {
      set.status = 404;
      return { error: 'Not found' };
    }

    if (!(await canEditProject(userId, existing.projectId))) {
      set.status = 403;
      return { error: 'Forbidden' };
    }

    const parsed = updateProjectPageSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 422;
      return { error: parsed.error.flatten() };
    }

    const data = parsed.data;
    if (data.title) {
      await db
        .update(projectNodes)
        .set({ title: data.title, updatedAt: new Date() })
        .where(eq(projectNodes.id, existing.nodeId));
    }

    if (data.bodyHtml !== undefined) {
      await db
        .update(projectPages)
        .set({ bodyHtml: data.bodyHtml, updatedAt: new Date() })
        .where(eq(projectPages.id, params.id));
    }

    await createPageSnapshot(params.id, userId);

    return (await loadPageDto(params.id))!;
  })
  .get('/pages/:id/versions', async ({ userId, params, set }) => {
    const existing = await loadPageDto(params.id);
    if (!existing) {
      set.status = 404;
      return { error: 'Not found' };
    }

    if (!(await canReadProject(userId, existing.projectId))) {
      set.status = 404;
      return { error: 'Not found' };
    }

    const rows = await db
      .select()
      .from(projectPageVersions)
      .where(eq(projectPageVersions.pageId, params.id))
      .orderBy(desc(projectPageVersions.createdAt));

    return rows.map((v) => ({
      id: v.id,
      pageId: v.pageId,
      createdBy: v.createdBy,
      createdAt: v.createdAt.toISOString(),
      snapshot: v.snapshotJson as Record<string, unknown>,
    }));
  })
  .get('/pages/:id/versions/:vid', async ({ userId, params, set }) => {
    const existing = await loadPageDto(params.id);
    if (!existing) {
      set.status = 404;
      return { error: 'Not found' };
    }

    if (!(await canReadProject(userId, existing.projectId))) {
      set.status = 404;
      return { error: 'Not found' };
    }

    const [row] = await db
      .select()
      .from(projectPageVersions)
      .where(
        and(
          eq(projectPageVersions.id, params.vid),
          eq(projectPageVersions.pageId, params.id),
        ),
      )
      .limit(1);

    if (!row) {
      set.status = 404;
      return { error: 'Not found' };
    }

    return {
      id: row.id,
      pageId: row.pageId,
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
      snapshot: row.snapshotJson as Record<string, unknown>,
    };
  });
