import {
  createExperimentSchema,
  listExperimentsQuerySchema,
  minimalExperimentFieldSeed,
  updateExperimentSchema,
} from '@labcollab/shared'
import { and, desc, eq } from 'drizzle-orm'
import { Elysia } from 'elysia'
import { db } from '../../db'
import { experiments, experimentVersions, users } from '../../db/schema'
import {
  assignFieldIds,
  buildChecklistFromSeed,
  buildFieldValues,
} from '../../lib/experiment-fields'
import {
  buildExperimentListConditions,
  experimentListOrder,
} from '../../lib/experiment-list'
import { experimentToSnapshot, parseFieldDefinitions, toExperimentDto } from '../../lib/mappers'
import {
  canEditExperiment,
  canEditProject,
  canReadExperiment,
  canReadProject,
} from '../../lib/rbac'
import {
  assertFolderParent,
  createExperimentNode,
  syncExperimentNodeTitle,
} from '../../lib/workspace'
import { authGuard } from '../../plugins/auth-guard'
import { getExperimentTemplateForCreate } from '../experiment-templates'

async function loadExperimentDto(experimentId: string) {
  const [row] = await db
    .select({
      experiment: experiments,
      authorDisplayName: users.displayName,
    })
    .from(experiments)
    .innerJoin(users, eq(users.id, experiments.authorId))
    .where(eq(experiments.id, experimentId))
    .limit(1)

  if (!row)
    return null
  return toExperimentDto(row.experiment, row.authorDisplayName)
}

async function createSnapshot(experimentId: string, userId: string, observationsText?: string) {
  const [row] = await db
    .select()
    .from(experiments)
    .where(eq(experiments.id, experimentId))
    .limit(1)

  if (!row)
    return

  await db.insert(experimentVersions).values({
    experimentId,
    createdBy: userId,
    snapshotJson: experimentToSnapshot(row, observationsText),
  })
}

async function resolveExperimentCreatePayload(
  userId: string,
  projectId: string,
  data: { title: string, templateId?: string, status?: typeof experiments.$inferSelect.status },
) {
  if (data.templateId) {
    const template = await getExperimentTemplateForCreate(data.templateId, projectId, userId)
    if (!template)
      return { error: 'Template not found' as const }

    const fieldDefinitions = parseFieldDefinitions(template.fieldDefinitions)
    const fieldValues = buildFieldValues(fieldDefinitions)
    const checklist = buildChecklistFromSeed(
      (template.defaultChecklist ?? []) as Array<{ text: string, order: number }>,
    )

    return {
      templateId: template.id,
      fieldDefinitions,
      fieldValues,
      checklist,
      observationsYjsState: template.defaultObservations,
    }
  }

  const fieldDefinitions = assignFieldIds(minimalExperimentFieldSeed)
  return {
    templateId: null,
    fieldDefinitions,
    fieldValues: buildFieldValues(fieldDefinitions),
    checklist: [] as ReturnType<typeof buildChecklistFromSeed>,
    observationsYjsState: null,
  }
}

export const experimentsModule = new Elysia()
  .use(authGuard)
  .get('/projects/:id/experiments', async ({ userId, params, query, set }) => {
    if (!(await canReadProject(userId, params.id))) {
      set.status = 404
      return { error: 'Not found' }
    }

    const parsed = listExperimentsQuerySchema.safeParse(query)
    if (!parsed.success) {
      set.status = 422
      return { error: parsed.error.flatten() }
    }

    const rows = await db
      .select({
        experiment: experiments,
        authorDisplayName: users.displayName,
      })
      .from(experiments)
      .innerJoin(users, eq(users.id, experiments.authorId))
      .where(buildExperimentListConditions(params.id, parsed.data))
      .orderBy(experimentListOrder)

    return rows.map(({ experiment, authorDisplayName }) =>
      toExperimentDto(experiment, authorDisplayName),
    )
  })
  .post('/projects/:id/experiments', async ({ userId, params, body, set }) => {
    if (!(await canEditProject(userId, params.id))) {
      set.status = 403
      return { error: 'Forbidden' }
    }

    const parsed = createExperimentSchema.safeParse(body)
    if (!parsed.success) {
      set.status = 422
      return { error: parsed.error.flatten() }
    }

    const data = parsed.data

    const parentCheck = await assertFolderParent(params.id, data.parentNodeId)
    if (!parentCheck.ok) {
      set.status = parentCheck.status
      return { error: parentCheck.error }
    }

    const resolved = await resolveExperimentCreatePayload(userId, params.id, data)
    if ('error' in resolved) {
      set.status = 404
      return { error: resolved.error }
    }

    const [row] = await db
      .insert(experiments)
      .values({
        projectId: params.id,
        authorId: userId,
        title: data.title,
        templateId: resolved.templateId,
        fieldDefinitions: resolved.fieldDefinitions,
        fieldValues: resolved.fieldValues,
        checklist: resolved.checklist,
        observationsYjsState: resolved.observationsYjsState,
        status: data.status ?? 'draft',
        tags: data.tags ?? [],
        conductedAt: data.conductedAt ? new Date(data.conductedAt) : null,
      })
      .returning()

    await createSnapshot(row.id, userId, row.observationsYjsState ?? '')

    await createExperimentNode({
      projectId: params.id,
      experimentId: row.id,
      title: row.title,
      authorId: userId,
      parentNodeId: data.parentNodeId,
    })

    return (await loadExperimentDto(row.id))!
  })
  .delete('/experiments/:id', async ({ userId, params, set }) => {
    if (!(await canEditExperiment(userId, params.id))) {
      set.status = 403
      return { error: 'Forbidden' }
    }

    const [row] = await db
      .select({ id: experiments.id })
      .from(experiments)
      .where(eq(experiments.id, params.id))
      .limit(1)

    if (!row) {
      set.status = 404
      return { error: 'Not found' }
    }

    await db.delete(experiments).where(eq(experiments.id, params.id))
    return { ok: true }
  })
  .get('/experiments/:id', async ({ userId, params, set }) => {
    if (!(await canReadExperiment(userId, params.id))) {
      set.status = 404
      return { error: 'Not found' }
    }

    const dto = await loadExperimentDto(params.id)
    if (!dto) {
      set.status = 404
      return { error: 'Not found' }
    }
    return dto
  })
  .patch('/experiments/:id', async ({ userId, params, body, set }) => {
    if (!(await canEditExperiment(userId, params.id))) {
      set.status = 403
      return { error: 'Forbidden' }
    }

    const parsed = updateExperimentSchema.safeParse(body)
    if (!parsed.success) {
      set.status = 422
      return { error: parsed.error.flatten() }
    }

    const data = parsed.data

    const [row] = await db
      .update(experiments)
      .set({
        ...(data.title !== undefined && { title: data.title }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.fieldValues !== undefined && { fieldValues: data.fieldValues }),
        ...(data.checklist !== undefined && { checklist: data.checklist }),
        ...(data.observationsText !== undefined && { observationsYjsState: data.observationsText }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.conductedAt !== undefined && {
          conductedAt: data.conductedAt ? new Date(data.conductedAt) : null,
        }),
        updatedAt: new Date(),
      })
      .where(eq(experiments.id, params.id))
      .returning()

    await createSnapshot(
      row.id,
      userId,
      data.observationsText ?? row.observationsYjsState ?? '',
    )

    if (data.title !== undefined) {
      await syncExperimentNodeTitle(row.id, data.title)
    }

    return (await loadExperimentDto(row.id))!
  })
  .get('/experiments/:id/versions', async ({ userId, params, set }) => {
    if (!(await canReadExperiment(userId, params.id))) {
      set.status = 404
      return { error: 'Not found' }
    }

    const rows = await db
      .select({
        version: experimentVersions,
        createdByDisplayName: users.displayName,
      })
      .from(experimentVersions)
      .innerJoin(users, eq(users.id, experimentVersions.createdBy))
      .where(eq(experimentVersions.experimentId, params.id))
      .orderBy(desc(experimentVersions.createdAt))

    return rows.map(({ version: v, createdByDisplayName }) => ({
      id: v.id,
      experimentId: v.experimentId,
      createdBy: v.createdBy,
      createdByDisplayName,
      createdAt: v.createdAt.toISOString(),
      snapshot: v.snapshotJson as Record<string, unknown>,
    }))
  })
  .get('/experiments/:id/versions/:vid', async ({ userId, params, set }) => {
    if (!(await canReadExperiment(userId, params.id))) {
      set.status = 404
      return { error: 'Not found' }
    }

    const [row] = await db
      .select({
        version: experimentVersions,
        createdByDisplayName: users.displayName,
      })
      .from(experimentVersions)
      .innerJoin(users, eq(users.id, experimentVersions.createdBy))
      .where(
        and(
          eq(experimentVersions.id, params.vid),
          eq(experimentVersions.experimentId, params.id),
        ),
      )
      .limit(1)

    if (!row) {
      set.status = 404
      return { error: 'Not found' }
    }

    return {
      id: row.version.id,
      experimentId: row.version.experimentId,
      createdBy: row.version.createdBy,
      createdByDisplayName: row.createdByDisplayName,
      createdAt: row.version.createdAt.toISOString(),
      snapshot: row.version.snapshotJson as Record<string, unknown>,
    }
  })
