import {
  copyUserExperimentTemplateToProjectSchema,
  createExperimentTemplateSchema,
  updateExperimentTemplateSchema,
} from '@labcollab/shared'
import { and, asc, eq } from 'drizzle-orm'
import { Elysia } from 'elysia'
import { db } from '../../db'
import { experimentTemplates } from '../../db/schema'
import { normalizeTemplateFieldDefinitions } from '../../lib/experiment-fields'
import { toExperimentTemplateDto } from '../../lib/mappers'
import { canEditProject, canReadProject } from '../../lib/rbac'
import { authGuard } from '../../plugins/auth-guard'

async function loadTemplate(id: string) {
  const [row] = await db
    .select()
    .from(experimentTemplates)
    .where(eq(experimentTemplates.id, id))
    .limit(1)
  return row ?? null
}

async function canEditTemplate(userId: string, template: typeof experimentTemplates.$inferSelect) {
  if (template.scope === 'user')
    return template.userId === userId
  if (template.scope === 'project' && template.projectId)
    return canEditProject(userId, template.projectId)
  return false
}

export const experimentTemplatesModule = new Elysia()
  .use(authGuard)
  .get('/users/me/experiment-templates', async ({ userId }) => {
    const rows = await db
      .select()
      .from(experimentTemplates)
      .where(and(eq(experimentTemplates.scope, 'user'), eq(experimentTemplates.userId, userId)))
      .orderBy(asc(experimentTemplates.name))

    return rows.map(toExperimentTemplateDto)
  })
  .post('/users/me/experiment-templates', async ({ userId, body, set }) => {
    const parsed = createExperimentTemplateSchema.safeParse(body)
    if (!parsed.success) {
      set.status = 422
      return { error: parsed.error.flatten() }
    }

    const data = parsed.data
    const fieldDefinitions = normalizeTemplateFieldDefinitions(data.fieldDefinitions)

    const [row] = await db
      .insert(experimentTemplates)
      .values({
        name: data.name,
        scope: 'user',
        userId,
        projectId: null,
        fieldDefinitions,
        defaultObservations: data.defaultObservations ?? null,
        defaultChecklist: data.defaultChecklist ?? [],
      })
      .returning()

    return toExperimentTemplateDto(row)
  })
  .get('/projects/:id/experiment-templates', async ({ userId, params, set }) => {
    if (!(await canReadProject(userId, params.id))) {
      set.status = 404
      return { error: 'Not found' }
    }

    const rows = await db
      .select()
      .from(experimentTemplates)
      .where(
        and(
          eq(experimentTemplates.scope, 'project'),
          eq(experimentTemplates.projectId, params.id),
        ),
      )
      .orderBy(asc(experimentTemplates.name))

    return rows.map(toExperimentTemplateDto)
  })
  .post('/projects/:id/experiment-templates', async ({ userId, params, body, set }) => {
    if (!(await canEditProject(userId, params.id))) {
      set.status = 403
      return { error: 'Forbidden' }
    }

    const parsed = createExperimentTemplateSchema.safeParse(body)
    if (!parsed.success) {
      set.status = 422
      return { error: parsed.error.flatten() }
    }

    const data = parsed.data
    const fieldDefinitions = normalizeTemplateFieldDefinitions(data.fieldDefinitions)

    const [row] = await db
      .insert(experimentTemplates)
      .values({
        name: data.name,
        scope: 'project',
        userId: null,
        projectId: params.id,
        fieldDefinitions,
        defaultObservations: data.defaultObservations ?? null,
        defaultChecklist: data.defaultChecklist ?? [],
      })
      .returning()

    return toExperimentTemplateDto(row)
  })
  .post('/projects/:id/experiment-templates/copy-from-user', async ({ userId, params, body, set }) => {
    if (!(await canEditProject(userId, params.id))) {
      set.status = 403
      return { error: 'Forbidden' }
    }

    const parsed = copyUserExperimentTemplateToProjectSchema.safeParse(body)
    if (!parsed.success) {
      set.status = 422
      return { error: parsed.error.flatten() }
    }

    const source = await loadTemplate(parsed.data.sourceTemplateId)
    if (!source || source.scope !== 'user' || source.userId !== userId) {
      set.status = 404
      return { error: 'Not found' }
    }

    const existingRows = await db
      .select({ name: experimentTemplates.name })
      .from(experimentTemplates)
      .where(
        and(
          eq(experimentTemplates.scope, 'project'),
          eq(experimentTemplates.projectId, params.id),
        ),
      )

    const existingNames = new Set(existingRows.map(row => row.name))
    let copyName = source.name
    if (existingNames.has(copyName)) {
      let index = 2
      while (existingNames.has(`${source.name} (${index})`))
        index += 1
      copyName = `${source.name} (${index})`
    }

    const [row] = await db
      .insert(experimentTemplates)
      .values({
        name: copyName,
        scope: 'project',
        userId: null,
        projectId: params.id,
        fieldDefinitions: source.fieldDefinitions,
        defaultObservations: source.defaultObservations,
        defaultChecklist: source.defaultChecklist ?? [],
      })
      .returning()

    return toExperimentTemplateDto(row)
  })
  .patch('/experiment-templates/:id', async ({ userId, params, body, set }) => {
    const template = await loadTemplate(params.id)
    if (!template) {
      set.status = 404
      return { error: 'Not found' }
    }

    if (template.scope === 'project' && template.projectId) {
      if (!(await canReadProject(userId, template.projectId))) {
        set.status = 404
        return { error: 'Not found' }
      }
    }
    else if (template.scope === 'user' && template.userId !== userId) {
      set.status = 404
      return { error: 'Not found' }
    }

    if (!(await canEditTemplate(userId, template))) {
      set.status = 403
      return { error: 'Forbidden' }
    }

    const parsed = updateExperimentTemplateSchema.safeParse(body)
    if (!parsed.success) {
      set.status = 422
      return { error: parsed.error.flatten() }
    }

    const data = parsed.data

    const [row] = await db
      .update(experimentTemplates)
      .set({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.fieldDefinitions !== undefined && {
          fieldDefinitions: normalizeTemplateFieldDefinitions(data.fieldDefinitions),
        }),
        ...(data.defaultObservations !== undefined && {
          defaultObservations: data.defaultObservations,
        }),
        ...(data.defaultChecklist !== undefined && { defaultChecklist: data.defaultChecklist }),
        updatedAt: new Date(),
      })
      .where(eq(experimentTemplates.id, params.id))
      .returning()

    return toExperimentTemplateDto(row)
  })
  .delete('/experiment-templates/:id', async ({ userId, params, set }) => {
    const template = await loadTemplate(params.id)
    if (!template) {
      set.status = 404
      return { error: 'Not found' }
    }

    if (template.scope === 'project' && template.projectId) {
      if (!(await canReadProject(userId, template.projectId))) {
        set.status = 404
        return { error: 'Not found' }
      }
    }
    else if (template.scope === 'user' && template.userId !== userId) {
      set.status = 404
      return { error: 'Not found' }
    }

    if (!(await canEditTemplate(userId, template))) {
      set.status = 403
      return { error: 'Forbidden' }
    }

    await db.delete(experimentTemplates).where(eq(experimentTemplates.id, params.id))
    return { ok: true as const }
  })

export async function getExperimentTemplateForCreate(
  templateId: string,
  projectId: string,
  userId: string,
) {
  const template = await loadTemplate(templateId)
  if (!template)
    return null

  if (template.scope === 'project') {
    if (template.projectId !== projectId)
      return null
    if (!(await canReadProject(userId, projectId)))
      return null
  }
  else if (template.scope === 'user') {
    if (template.userId !== userId)
      return null
  }
  else {
    return null
  }

  return template
}
