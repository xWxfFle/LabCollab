import { and, eq, ilike, or, sql } from 'drizzle-orm';
import type { WorkspaceSearchResultDto } from '@labcollab/shared';
import { db } from '../db';
import { experiments, projectNodes, projectPages } from '../db/schema';

export async function searchWorkspace(
  projectId: string,
  q: string,
): Promise<WorkspaceSearchResultDto> {
  const pattern = `%${q}%`;

  const pageRows = await db
    .select({
      id: projectPages.id,
      nodeId: projectPages.nodeId,
      title: projectNodes.title,
    })
    .from(projectPages)
    .innerJoin(projectNodes, eq(projectNodes.id, projectPages.nodeId))
    .where(
      and(
        eq(projectPages.projectId, projectId),
        eq(projectNodes.nodeType, 'page'),
        or(ilike(projectNodes.title, pattern), ilike(projectPages.bodyHtml, pattern)),
      ),
    )
    .limit(20);

  const experimentRows = await db
    .select({
      id: experiments.id,
      nodeId: projectNodes.id,
      title: projectNodes.title,
    })
    .from(projectNodes)
    .innerJoin(experiments, eq(experiments.id, projectNodes.experimentId))
    .where(
      and(
        eq(projectNodes.projectId, projectId),
        eq(projectNodes.nodeType, 'experiment'),
        or(
          ilike(projectNodes.title, pattern),
          ilike(experiments.objective, pattern),
          ilike(experiments.hypothesis, pattern),
          ilike(experiments.materials, pattern),
          sql`exists (select 1 from unnest(${experiments.tags}) t where t ilike ${pattern})`,
        ),
      ),
    )
    .limit(20);

  return {
    pages: pageRows,
    experiments: experimentRows,
  };
}
