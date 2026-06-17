import { createCommentSchema } from '@labcollab/shared'
import { asc, eq } from 'drizzle-orm'
import { Elysia } from 'elysia'
import { db } from '../../db'
import { experimentComments, users } from '../../db/schema'
import {
  canManageProject,
  canReadExperiment,
  getExperimentProjectId,
} from '../../lib/rbac'
import { authGuard } from '../../plugins/auth-guard'

export const commentsModule = new Elysia()
  .use(authGuard)
  .get('/experiments/:id/comments', async ({ userId, params, set }) => {
    if (!(await canReadExperiment(userId, params.id))) {
      set.status = 404
      return { error: 'Not found' }
    }

    const rows = await db
      .select({
        id: experimentComments.id,
        experimentId: experimentComments.experimentId,
        authorId: experimentComments.authorId,
        authorDisplayName: users.displayName,
        body: experimentComments.body,
        createdAt: experimentComments.createdAt,
        updatedAt: experimentComments.updatedAt,
      })
      .from(experimentComments)
      .innerJoin(users, eq(users.id, experimentComments.authorId))
      .where(eq(experimentComments.experimentId, params.id))
      .orderBy(asc(experimentComments.createdAt))

    return rows.map(row => ({
      id: row.id,
      experimentId: row.experimentId,
      authorId: row.authorId,
      authorDisplayName: row.authorDisplayName,
      body: row.body,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }))
  })
  .post('/experiments/:id/comments', async ({ userId, params, body, set }) => {
    if (!(await canReadExperiment(userId, params.id))) {
      set.status = 404
      return { error: 'Not found' }
    }

    const parsed = createCommentSchema.safeParse(body)
    if (!parsed.success) {
      set.status = 422
      return { error: parsed.error.flatten() }
    }

    const [row] = await db
      .insert(experimentComments)
      .values({
        experimentId: params.id,
        authorId: userId,
        body: parsed.data.body,
      })
      .returning()

    const [author] = await db
      .select({ displayName: users.displayName })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    return {
      id: row.id,
      experimentId: row.experimentId,
      authorId: row.authorId,
      authorDisplayName: author?.displayName ?? '',
      body: row.body,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }
  })
  .delete('/comments/:id', async ({ userId, params, set }) => {
    const [comment] = await db
      .select()
      .from(experimentComments)
      .where(eq(experimentComments.id, params.id))
      .limit(1)

    if (!comment) {
      set.status = 404
      return { error: 'Not found' }
    }

    const projectId = await getExperimentProjectId(comment.experimentId)
    if (!projectId) {
      set.status = 404
      return { error: 'Not found' }
    }

    const isAuthor = comment.authorId === userId
    const isOwner = await canManageProject(userId, projectId)

    if (!isAuthor && !isOwner) {
      set.status = 403
      return { error: 'Forbidden' }
    }

    await db.delete(experimentComments).where(eq(experimentComments.id, params.id))

    return { ok: true }
  })
