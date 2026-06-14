import { and, eq } from 'drizzle-orm';
import { Elysia } from 'elysia';
import { db } from '../../db';
import { projectMembers, projects, users } from '../../db/schema';
import { addMemberSchema, createProjectSchema } from '@labcollab/shared';
import { toProjectDto } from '../../lib/mappers';
import { canManageProject, canReadProject } from '../../lib/rbac';
import { authGuard } from '../../plugins/auth-guard';

export const projectsModule = new Elysia({ prefix: '/projects' })
  .use(authGuard)
  .get('/', async ({ userId }) => {
    const rows = await db
      .select({ project: projects, role: projectMembers.role })
      .from(projectMembers)
      .innerJoin(projects, eq(projects.id, projectMembers.projectId))
      .where(eq(projectMembers.userId, userId));

    return rows.map(({ project, role }) => toProjectDto(project, role));
  })
  .post('/', async ({ userId, body, set }) => {
    const parsed = createProjectSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 422;
      return { error: parsed.error.flatten() };
    }

    const [project] = await db
      .insert(projects)
      .values({
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        ownerId: userId,
      })
      .returning();

    await db.insert(projectMembers).values({
      projectId: project.id,
      userId,
      role: 'owner',
    });

    return toProjectDto(project, 'owner');
  })
  .get('/:id', async ({ userId, params, set }) => {
    const [row] = await db
      .select({ project: projects, role: projectMembers.role })
      .from(projectMembers)
      .innerJoin(projects, eq(projects.id, projectMembers.projectId))
      .where(and(eq(projectMembers.projectId, params.id), eq(projectMembers.userId, userId)))
      .limit(1);

    if (!row) {
      set.status = 404;
      return { error: 'Not found' };
    }

    return toProjectDto(row.project, row.role);
  })
  .get('/:id/members', async ({ userId, params, set }) => {
    if (!(await canReadProject(userId, params.id))) {
      set.status = 404;
      return { error: 'Not found' };
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
      .where(eq(projectMembers.projectId, params.id));

    return rows;
  })
  .post('/:id/members', async ({ userId, params, body, set }) => {
    if (!(await canManageProject(userId, params.id))) {
      set.status = 403;
      return { error: 'Forbidden' };
    }

    const parsed = addMemberSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 422;
      return { error: parsed.error.flatten() };
    }

    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, parsed.data.email))
      .limit(1);

    if (!targetUser) {
      set.status = 404;
      return { error: 'User not found' };
    }

    await db
      .insert(projectMembers)
      .values({
        projectId: params.id,
        userId: targetUser.id,
        role: parsed.data.role,
      })
      .onConflictDoNothing();

    return {
      userId: targetUser.id,
      email: targetUser.email,
      displayName: targetUser.displayName,
      role: parsed.data.role,
    };
  });
