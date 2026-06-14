import { z } from 'zod';

export const projectRoleSchema = z.enum(['owner', 'editor', 'viewer']);
export const experimentStatusSchema = z.enum(['draft', 'in_progress', 'completed']);

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(100),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

export const addMemberSchema = z.object({
  email: z.email(),
  role: z.enum(['editor', 'viewer']),
});

const experimentTagsSchema = z.array(z.string().min(1).max(50)).max(20);

export const projectNodeTypeSchema = z.enum(['folder', 'page', 'experiment']);

export const createExperimentSchema = z.object({
  title: z.string().min(1).max(300),
  objective: z.string().min(1),
  parentNodeId: z.string().uuid().optional(),
  status: experimentStatusSchema.optional(),
  hypothesis: z.string().optional(),
  materials: z.string().optional(),
  protocolSteps: z.string().optional(),
  conditions: z.string().optional(),
  results: z.string().optional(),
  tags: experimentTagsSchema.optional(),
  conductedAt: z.string().datetime().optional().nullable(),
});

export const updateExperimentSchema = createExperimentSchema.partial();

export const listExperimentsQuerySchema = z.object({
  status: experimentStatusSchema.optional(),
  q: z.string().min(1).max(200).optional(),
});

export const createCommentSchema = z.object({
  body: z.string().min(1).max(5000),
});

export const createFolderSchema = z.object({
  title: z.string().min(1).max(200),
  parentId: z.string().uuid().optional().nullable(),
});

export const createProjectPageSchema = z.object({
  title: z.string().min(1).max(200),
  parentId: z.string().uuid().optional().nullable(),
});

export const updateWorkspaceNodeSchema = z.object({
  title: z.string().min(1).max(200).optional(),
});

export const moveWorkspaceNodeSchema = z.object({
  parentId: z.string().uuid().nullable(),
  sortOrder: z.number().int().min(0),
});

export const updateProjectPageSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  bodyHtml: z.string().max(500_000).optional(),
});

export const workspaceSearchQuerySchema = z.object({
  q: z.string().min(1).max(200),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type CreateExperimentInput = z.infer<typeof createExperimentSchema>;
export type UpdateExperimentInput = z.infer<typeof updateExperimentSchema>;
export type ListExperimentsQuery = z.infer<typeof listExperimentsQuerySchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type CreateProjectPageInput = z.infer<typeof createProjectPageSchema>;
export type UpdateWorkspaceNodeInput = z.infer<typeof updateWorkspaceNodeSchema>;
export type MoveWorkspaceNodeInput = z.infer<typeof moveWorkspaceNodeSchema>;
export type UpdateProjectPageInput = z.infer<typeof updateProjectPageSchema>;
export type WorkspaceSearchQuery = z.infer<typeof workspaceSearchQuerySchema>;
