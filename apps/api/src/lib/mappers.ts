import type {
  ExperimentChecklistItem,
  ExperimentDto,
  ExperimentFieldDefinition,
  ExperimentTemplateDto,
  ProjectDto,
} from '@labcollab/shared'
import type { experiments, experimentTemplates, projectMembers, projects } from '../db/schema'

type ExperimentRow = typeof experiments.$inferSelect
type ExperimentTemplateRow = typeof experimentTemplates.$inferSelect
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

export function parseFieldDefinitions(value: unknown): ExperimentFieldDefinition[] {
  if (!Array.isArray(value))
    return []
  return value as ExperimentFieldDefinition[]
}

export function parseFieldValues(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return {}
  return value as Record<string, string>
}

export function parseChecklist(value: unknown): ExperimentChecklistItem[] {
  if (!Array.isArray(value))
    return []
  return value as ExperimentChecklistItem[]
}

export function toExperimentTemplateDto(row: ExperimentTemplateRow): ExperimentTemplateDto {
  return {
    id: row.id,
    name: row.name,
    scope: row.scope,
    userId: row.userId,
    projectId: row.projectId,
    fieldDefinitions: parseFieldDefinitions(row.fieldDefinitions),
    defaultObservations: row.defaultObservations,
    defaultChecklist: (row.defaultChecklist ?? []) as ExperimentTemplateDto['defaultChecklist'],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
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
    templateId: row.templateId,
    fieldDefinitions: parseFieldDefinitions(row.fieldDefinitions),
    fieldValues: parseFieldValues(row.fieldValues),
    checklist: parseChecklist(row.checklist),
    observationsText: row.observationsYjsState,
    tags: row.tags ?? [],
    conductedAt: row.conductedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export function experimentToSnapshot(row: ExperimentRow, observationsText?: string) {
  const dto = toExperimentDto(row)
  return {
    ...dto,
    observationsText: observationsText ?? dto.observationsText ?? '',
  }
}
