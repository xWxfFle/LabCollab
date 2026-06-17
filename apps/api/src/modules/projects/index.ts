import { addMemberSchema, createProjectSchema, updateMemberRoleSchema, updateProjectSchema } from '@labcollab/shared'
import { and, eq } from 'drizzle-orm'
import { Elysia } from 'elysia'
import { db } from '../../db'
import { projectMembers, projects, users } from '../../db/schema'
import { seedDefaultProjectExperimentTemplate } from '../../lib/experiment-template-seed'
import { toProjectDto } from '../../lib/mappers'
import { canManageProject, canReadProject, getProjectRole } from '../../lib/rbac'
import { authGuard } from '../../plugins/auth-guard'

export const projectsModule = new Elysia({ prefix: '/projects' })
  .use(authGuard)
  .get('/', async ({ userId }) => {
    const rows = await db
      .select({ project: projects, role: projectMembers.role })
      .from(projectMembers)
      .innerJoin(projects, eq(projects.id, projectMembers.projectId))
      .where(eq(projectMembers.userId, userId))

    return rows.map(({ project, role }) => toProjectDto(project, role))
  })
  .post('/', async ({ userId, body, set }) => {
    const parsed = createProjectSchema.safeParse(body)
    if (!parsed.success) {
      set.status = 422
      return { error: parsed.error.flatten() }
    }

    const [project] = await db
      .insert(projects)
      .values({
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        ownerId: userId,
      })
      .returning()

    await db.insert(projectMembers).values({
      projectId: project.id,
      userId,
      role: 'owner',
    })

    await seedDefaultProjectExperimentTemplate(project.id)

    return toProjectDto(project, 'owner')
  })
  .get('/:id', async ({ userId, params, set }) => {
    const [row] = await db
      .select({ project: projects, role: projectMembers.role })
      .from(projectMembers)
      .innerJoin(projects, eq(projects.id, projectMembers.projectId))
      .where(and(eq(projectMembers.projectId, params.id), eq(projectMembers.userId, userId)))
      .limit(1)

    if (!row) {
      set.status = 404
      return { error: 'Not found' }
    }

    return toProjectDto(row.project, row.role)
  })
  .get('/:id/members', async ({ userId, params, set }) => {
    if (!(await canReadProject(userId, params.id))) {
      set.status = 404
      return { error: 'Not found' }
    }

    const rows = await db
      .select({
        userId: users.id,
        email: users.email,
        displayName: users.displayName,
        role: projectMembers.role,
      })
      .from(projectMembers)
      .innerJoin(users, eq(users.id, projectMembers.userId))
      .where(eq(projectMembers.projectId, params.id))

    return rows
  })
  .post('/:id/members', async ({ userId, params, body, set }) => {
    if (!(await canManageProject(userId, params.id))) {
      set.status = 403
      return { error: 'Forbidden' }
    }

    const parsed = addMemberSchema.safeParse(body)
    if (!parsed.success) {
      set.status = 422
      return { error: parsed.error.flatten() }
    }

    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, parsed.data.email))
      .limit(1)

    if (!targetUser) {
      set.status = 404
      return { error: 'User not found' }
    }

    await db
      .insert(projectMembers)
      .values({
        projectId: params.id,
        userId: targetUser.id,
        role: parsed.data.role,
      })
      .onConflictDoNothing()

    return {
      userId: targetUser.id,
      email: targetUser.email,
      displayName: targetUser.displayName,
      role: parsed.data.role,
    }
  })
  .patch('/:id', async ({ userId, params, body, set }) => {
    if (!(await canManageProject(userId, params.id))) {
      set.status = 403
      return { error: 'Forbidden' }
    }

    const parsed = updateProjectSchema.safeParse(body)
    if (!parsed.success) {
      set.status = 422
      return { error: parsed.error.flatten() }
    }

    if (parsed.data.name === undefined && parsed.data.description === undefined) {
      set.status = 422
      return { error: 'Nothing to update' }
    }

    const [project] = await db
      .update(projects)
      .set({
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.description !== undefined
          ? { description: parsed.data.description }
          : {}),
      })
      .where(eq(projects.id, params.id))
      .returning()

    if (!project) {
      set.status = 404
      return { error: 'Not found' }
    }

    const role = await getProjectRole(userId, params.id)
    return toProjectDto(project, role ?? 'owner')
  })
  .delete('/:id', async ({ userId, params, set }) => {
    if (!(await canManageProject(userId, params.id))) {
      set.status = 403
      return { error: 'Forbidden' }
    }

    const [deleted] = await db
      .delete(projects)
      .where(eq(projects.id, params.id))
      .returning({ id: projects.id })

    if (!deleted) {
      set.status = 404
      return { error: 'Not found' }
    }

    return { ok: true as const }
  })
  .patch('/:id/members/:memberUserId', async ({ userId, params, body, set }) => {
    if (!(await canManageProject(userId, params.id))) {
      set.status = 403
      return { error: 'Forbidden' }
    }

    const parsed = updateMemberRoleSchema.safeParse(body)
    if (!parsed.success) {
      set.status = 422
      return { error: parsed.error.flatten() }
    }

    const [existing] = await db
      .select({ role: projectMembers.role })
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, params.id),
          eq(projectMembers.userId, params.memberUserId),
        ),
      )
      .limit(1)

    if (!existing) {
      set.status = 404
      return { error: 'Member not found' }
    }

    if (existing.role === 'owner') {
      set.status = 403
      return { error: 'Cannot change owner role' }
    }

    await db
      .update(projectMembers)
      .set({ role: parsed.data.role })
      .where(
        and(
          eq(projectMembers.projectId, params.id),
          eq(projectMembers.userId, params.memberUserId),
        ),
      )

    const [member] = await db
      .select({
        userId: users.id,
        email: users.email,
        displayName: users.displayName,
        role: projectMembers.role,
      })
      .from(projectMembers)
      .innerJoin(users, eq(users.id, projectMembers.userId))
      .where(
        and(
          eq(projectMembers.projectId, params.id),
          eq(projectMembers.userId, params.memberUserId),
        ),
      )
      .limit(1)

    return member
  })
  .delete('/:id/members/:memberUserId', async ({ userId, params, set }) => {
    if (!(await canManageProject(userId, params.id))) {
      set.status = 403
      return { error: 'Forbidden' }
    }

    const [existing] = await db
      .select({ role: projectMembers.role })
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, params.id),
          eq(projectMembers.userId, params.memberUserId),
        ),
      )
      .limit(1)

    if (!existing) {
      set.status = 404
      return { error: 'Member not found' }
    }

    if (existing.role === 'owner') {
      set.status = 403
      return { error: 'Cannot remove owner' }
    }

    await db
      .delete(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, params.id),
          eq(projectMembers.userId, params.memberUserId),
        ),
      )

    return { ok: true as const }
  })
