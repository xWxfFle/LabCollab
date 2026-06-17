import { z } from 'zod'
import {
  experimentChecklistSchema,
  fieldValuesSchema,
  templateChecklistSeedSchema,
} from './experiment-fields'

export const projectRoleSchema = z.enum(['owner', 'editor', 'viewer'])
export const experimentStatusSchema = z.enum([
  'draft',
  'in_progress',
  'completed_success',
  'completed_failure',
])
export const experimentTemplateScopeSchema = z.enum(['user', 'project'])

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(100),
})

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

export const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
})

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
})

export const addMemberSchema = z.object({
  email: z.email(),
  role: z.enum(['editor', 'viewer']),
})

export const updateMemberRoleSchema = z.object({
  role: z.enum(['editor', 'viewer']),
})

const experimentTagsSchema = z.array(z.string().min(1).max(50)).max(20)

export const projectNodeTypeSchema = z.enum(['folder', 'page', 'experiment'])

export const createExperimentSchema = z.object({
  title: z.string().min(1).max(300),
  parentNodeId: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
  status: experimentStatusSchema.optional(),
  tags: experimentTagsSchema.optional(),
  conductedAt: z.string().datetime().optional().nullable(),
})

export const updateExperimentSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  parentNodeId: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
  status: experimentStatusSchema.optional(),
  fieldValues: fieldValuesSchema.optional(),
  checklist: experimentChecklistSchema.optional(),
  observationsText: z.string().max(500_000).optional(),
  tags: experimentTagsSchema.optional(),
  conductedAt: z.string().datetime().optional().nullable(),
})

export const listExperimentsQuerySchema = z.object({
  status: experimentStatusSchema.optional(),
  q: z.string().min(1).max(200).optional(),
})

export const createCommentSchema = z.object({
  body: z.string().min(1).max(5000),
})

export const createFolderSchema = z.object({
  title: z.string().min(1).max(200),
  parentId: z.string().uuid().optional().nullable(),
})

export const createProjectPageSchema = z.object({
  title: z.string().min(1).max(200),
  parentId: z.string().uuid().optional().nullable(),
})

export const updateWorkspaceNodeSchema = z.object({
  title: z.string().min(1).max(200).optional(),
})

export const moveWorkspaceNodeSchema = z.object({
  parentId: z.string().uuid().nullable(),
  sortOrder: z.number().int().min(0),
})

export const updateProjectPageSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  bodyHtml: z.string().max(500_000).optional(),
})

export const workspaceSearchQuerySchema = z.object({
  q: z.string().min(1).max(200),
})

const templateFieldInputSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1).max(200),
  required: z.boolean(),
  order: z.number().int().min(0),
  defaultValue: z.string().max(50_000).optional(),
})

export const createExperimentTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  fieldDefinitions: z.array(templateFieldInputSchema).min(1),
  defaultObservations: z.string().max(500_000).optional().nullable(),
  defaultChecklist: templateChecklistSeedSchema.optional(),
})

export const updateExperimentTemplateSchema = createExperimentTemplateSchema.partial()

export const copyUserExperimentTemplateToProjectSchema = z.object({
  sourceTemplateId: z.string().uuid(),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type AddMemberInput = z.infer<typeof addMemberSchema>
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>
export type CreateExperimentInput = z.infer<typeof createExperimentSchema>
export type UpdateExperimentInput = z.infer<typeof updateExperimentSchema>
export type ListExperimentsQuery = z.infer<typeof listExperimentsQuerySchema>
export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type CreateFolderInput = z.infer<typeof createFolderSchema>
export type CreateProjectPageInput = z.infer<typeof createProjectPageSchema>
export type UpdateWorkspaceNodeInput = z.infer<typeof updateWorkspaceNodeSchema>
export type MoveWorkspaceNodeInput = z.infer<typeof moveWorkspaceNodeSchema>
export type UpdateProjectPageInput = z.infer<typeof updateProjectPageSchema>
export type WorkspaceSearchQuery = z.infer<typeof workspaceSearchQuerySchema>
export type CreateExperimentTemplateInput = z.infer<typeof createExperimentTemplateSchema>
export type UpdateExperimentTemplateInput = z.infer<typeof updateExperimentTemplateSchema>
export type CopyUserExperimentTemplateToProjectInput = z.infer<
  typeof copyUserExperimentTemplateToProjectSchema
>
