import type { ListExperimentsQuery } from '@labcollab/shared'
import type { SQL } from 'drizzle-orm'
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm'
import { experiments } from '../db/schema'

export function buildExperimentListConditions(
  projectId: string,
  query: ListExperimentsQuery,
): SQL {
  const conditions: SQL[] = [eq(experiments.projectId, projectId)]

  if (query.status) {
    conditions.push(eq(experiments.status, query.status))
  }

  if (query.q) {
    const pattern = `%${query.q}%`
    conditions.push(
      or(
        ilike(experiments.title, pattern),
        ilike(experiments.objective, pattern),
        ilike(experiments.hypothesis, pattern),
        ilike(experiments.materials, pattern),
        ilike(experiments.protocolSteps, pattern),
        ilike(experiments.conditions, pattern),
        ilike(experiments.results, pattern),
        ilike(experiments.observationsYjsState, pattern),
        sql`exists (select 1 from unnest(${experiments.tags}) as t(tag) where t.tag ilike ${pattern})`,
      )!,
    )
  }

  return and(...conditions)!
}

export const experimentListOrder = desc(experiments.updatedAt)
