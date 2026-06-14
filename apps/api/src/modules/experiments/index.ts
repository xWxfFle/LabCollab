import { and, desc, eq } from 'drizzle-orm';
import { Elysia } from 'elysia';
import { db } from '../../db';
import { experimentVersions, experiments, users } from '../../db/schema';
import {
  createExperimentSchema,
  listExperimentsQuerySchema,
  updateExperimentSchema,
} from '@labcollab/shared';
import { experimentToSnapshot, toExperimentDto } from '../../lib/mappers';
import {
  buildExperimentListConditions,
  experimentListOrder,
} from '../../lib/experiment-list';
import {
  assertFolderParent,
  createExperimentNode,
  syncExperimentNodeTitle,
} from '../../lib/workspace';
import {
  canEditExperiment,
  canEditProject,
  canReadExperiment,
  canReadProject,
} from '../../lib/rbac';
import { authGuard } from '../../plugins/auth-guard';

async function loadExperimentDto(experimentId: string) {
  const [row] = await db
    .select({
      experiment: experiments,
      authorDisplayName: users.displayName,
    })
    .from(experiments)
    .innerJoin(users, eq(users.id, experiments.authorId))
    .where(eq(experiments.id, experimentId))
    .limit(1);

  if (!row) return null;
  return toExperimentDto(row.experiment, row.authorDisplayName);
}

async function createSnapshot(experimentId: string, userId: string, observationsText = '') {
  const [row] = await db
    .select()
    .from(experiments)
    .where(eq(experiments.id, experimentId))
    .limit(1);

  if (!row) return;

  await db.insert(experimentVersions).values({
    experimentId,
    createdBy: userId,
    snapshotJson: experimentToSnapshot(row, observationsText),
  });
}

export const experimentsModule = new Elysia()
  .use(authGuard)
  .get('/projects/:id/experiments', async ({ userId, params, query, set }) => {
    if (!(await canReadProject(userId, params.id))) {
      set.status = 404;
      return { error: 'Not found' };
    }

    const parsed = listExperimentsQuerySchema.safeParse(query);
    if (!parsed.success) {
      set.status = 422;
      return { error: parsed.error.flatten() };
    }

    const rows = await db
      .select({
        experiment: experiments,
        authorDisplayName: users.displayName,
      })
      .from(experiments)
      .innerJoin(users, eq(users.id, experiments.authorId))
      .where(buildExperimentListConditions(params.id, parsed.data))
      .orderBy(experimentListOrder);

    return rows.map(({ experiment, authorDisplayName }) =>
      toExperimentDto(experiment, authorDisplayName),
    );
  })
  .post('/projects/:id/experiments', async ({ userId, params, body, set }) => {
    if (!(await canEditProject(userId, params.id))) {
      set.status = 403;
      return { error: 'Forbidden' };
    }

    const parsed = createExperimentSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 422;
      return { error: parsed.error.flatten() };
    }

    const data = parsed.data;

    const parentCheck = await assertFolderParent(params.id, data.parentNodeId);
    if (!parentCheck.ok) {
      set.status = parentCheck.status;
      return { error: parentCheck.error };
    }

    const [row] = await db
      .insert(experiments)
      .values({
        projectId: params.id,
        authorId: userId,
        title: data.title,
        objective: data.objective,
        status: data.status ?? 'draft',
        hypothesis: data.hypothesis ?? null,
        materials: data.materials ?? null,
        protocolSteps: data.protocolSteps ?? null,
        conditions: data.conditions ?? null,
        results: data.results ?? null,
        tags: data.tags ?? [],
        conductedAt: data.conductedAt ? new Date(data.conductedAt) : null,
      })
      .returning();

    await createSnapshot(row.id, userId);

    await createExperimentNode({
      projectId: params.id,
      experimentId: row.id,
      title: row.title,
      authorId: userId,
      parentNodeId: data.parentNodeId,
    });

    return (await loadExperimentDto(row.id))!;
  })
  .delete('/experiments/:id', async ({ userId, params, set }) => {
    if (!(await canEditExperiment(userId, params.id))) {
      set.status = 403;
      return { error: 'Forbidden' };
    }

    const [row] = await db
      .select({ id: experiments.id })
      .from(experiments)
      .where(eq(experiments.id, params.id))
      .limit(1);

    if (!row) {
      set.status = 404;
      return { error: 'Not found' };
    }

    await db.delete(experiments).where(eq(experiments.id, params.id));
    return { ok: true };
  })
  .get('/experiments/:id', async ({ userId, params, set }) => {
    if (!(await canReadExperiment(userId, params.id))) {
      set.status = 404;
      return { error: 'Not found' };
    }

    const dto = await loadExperimentDto(params.id);
    if (!dto) {
      set.status = 404;
      return { error: 'Not found' };
    }
    return dto;
  })
  .patch('/experiments/:id', async ({ userId, params, body, set }) => {
    if (!(await canEditExperiment(userId, params.id))) {
      set.status = 403;
      return { error: 'Forbidden' };
    }

    const parsed = updateExperimentSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 422;
      return { error: parsed.error.flatten() };
    }

    const data = parsed.data;
    const observationsText =
      typeof body === 'object' && body && 'observationsText' in body
        ? String((body as { observationsText?: string }).observationsText ?? '')
        : undefined;

    const [row] = await db
      .update(experiments)
      .set({
        ...(data.title !== undefined && { title: data.title }),
        ...(data.objective !== undefined && { objective: data.objective }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.hypothesis !== undefined && { hypothesis: data.hypothesis }),
        ...(data.materials !== undefined && { materials: data.materials }),
        ...(data.protocolSteps !== undefined && { protocolSteps: data.protocolSteps }),
        ...(data.conditions !== undefined && { conditions: data.conditions }),
        ...(data.results !== undefined && { results: data.results }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.conductedAt !== undefined && {
          conductedAt: data.conductedAt ? new Date(data.conductedAt) : null,
        }),
        ...(observationsText !== undefined && { observationsYjsState: observationsText }),
        updatedAt: new Date(),
      })
      .where(eq(experiments.id, params.id))
      .returning();

    if (observationsText !== undefined) {
      await createSnapshot(row.id, userId, observationsText);
    } else {
      await createSnapshot(row.id, userId, row.observationsYjsState ?? '');
    }

    if (data.title !== undefined) {
      await syncExperimentNodeTitle(row.id, data.title);
    }

    return (await loadExperimentDto(row.id))!;
  })
  .get('/experiments/:id/versions', async ({ userId, params, set }) => {
    if (!(await canReadExperiment(userId, params.id))) {
      set.status = 404;
      return { error: 'Not found' };
    }

    const rows = await db
      .select()
      .from(experimentVersions)
      .where(eq(experimentVersions.experimentId, params.id))
      .orderBy(desc(experimentVersions.createdAt));

    return rows.map((v) => ({
      id: v.id,
      experimentId: v.experimentId,
      createdBy: v.createdBy,
      createdAt: v.createdAt.toISOString(),
      snapshot: v.snapshotJson as Record<string, unknown>,
    }));
  })
  .get('/experiments/:id/versions/:vid', async ({ userId, params, set }) => {
    if (!(await canReadExperiment(userId, params.id))) {
      set.status = 404;
      return { error: 'Not found' };
    }

    const [row] = await db
      .select()
      .from(experimentVersions)
      .where(
        and(
          eq(experimentVersions.id, params.vid),
          eq(experimentVersions.experimentId, params.id),
        ),
      )
      .limit(1);

    if (!row) {
      set.status = 404;
      return { error: 'Not found' };
    }

    return {
      id: row.id,
      experimentId: row.experimentId,
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
      snapshot: row.snapshotJson as Record<string, unknown>,
    };
  });
