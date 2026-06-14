import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import { experiments, projectMembers, projects } from '../db/schema';
import type { ProjectRole } from '@labcollab/shared';

export async function getProjectRole(
  userId: string,
  projectId: string,
): Promise<ProjectRole | null> {
  const [row] = await db
    .select({ role: projectMembers.role })
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
    .limit(1);

  return row?.role ?? null;
}

export async function canReadProject(userId: string, projectId: string): Promise<boolean> {
  return (await getProjectRole(userId, projectId)) !== null;
}

export async function canEditProject(userId: string, projectId: string): Promise<boolean> {
  const role = await getProjectRole(userId, projectId);
  return role === 'owner' || role === 'editor';
}

export async function canManageProject(userId: string, projectId: string): Promise<boolean> {
  const role = await getProjectRole(userId, projectId);
  return role === 'owner';
}

export async function getExperimentProjectId(experimentId: string): Promise<string | null> {
  const [row] = await db
    .select({ projectId: experiments.projectId })
    .from(experiments)
    .where(eq(experiments.id, experimentId))
    .limit(1);

  return row?.projectId ?? null;
}

export async function canReadExperiment(userId: string, experimentId: string): Promise<boolean> {
  const projectId = await getExperimentProjectId(experimentId);
  if (!projectId) return false;
  return canReadProject(userId, projectId);
}

export async function canEditExperiment(userId: string, experimentId: string): Promise<boolean> {
  const projectId = await getExperimentProjectId(experimentId);
  if (!projectId) return false;
  return canEditProject(userId, projectId);
}

export async function assertProjectExists(projectId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  return !!row;
}
