import type { ExperimentDto, ProjectDto } from '@labcollab/shared'
import type { experiments, projectMembers, projects } from '../db/schema'

type ExperimentRow = typeof experiments.$inferSelect
type ProjectRow = typeof projects.$inferSelect
type ProjectRole = typeof projectMembers.$inferSelect.role

export function toProjectDto(project: ProjectRow, role: ProjectRole): ProjectDto {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    ownerId: project.ownerId,
    role,
    createdAt: project.createdAt.toISOString(),
  }
}

export function toExperimentDto(
  row: ExperimentRow,
  authorDisplayName: string | null = null,
): ExperimentDto {
  return {
    id: row.id,
    projectId: row.projectId,
    authorId: row.authorId,
    authorDisplayName,
    title: row.title,
    status: row.status,
    hypothesis: row.hypothesis,
    objective: row.objective,
    materials: row.materials,
    protocolSteps: row.protocolSteps,
    conditions: row.conditions,
    results: row.results,
    observationsText: row.observationsYjsState,
    tags: row.tags ?? [],
    conductedAt: row.conductedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export function experimentToSnapshot(row: ExperimentRow, observationsText = '') {
  return {
    ...toExperimentDto(row),
    observationsText,
  }
}
