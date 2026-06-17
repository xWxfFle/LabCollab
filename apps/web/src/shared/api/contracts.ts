import { experimentStatusSchema, projectNodeTypeSchema } from '@labcollab/shared'
import { z } from 'zod'

export const userDtoSchema = z.object({
  id: z.string(),
  email: z.string(),
  displayName: z.string(),
  createdAt: z.string(),
})

export const authResponseSchema = z.object({
  accessToken: z.string(),
  user: userDtoSchema,
})

export const meResponseSchema = z.object({
  user: userDtoSchema,
})

export const projectDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  ownerId: z.string(),
  role: z.enum(['owner', 'editor', 'viewer']),
  createdAt: z.string(),
})

export const experimentDtoSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  authorId: z.string(),
  authorDisplayName: z.string().nullable(),
  title: z.string(),
  status: experimentStatusSchema,
  hypothesis: z.string().nullable(),
  objective: z.string(),
  materials: z.string().nullable(),
  protocolSteps: z.string().nullable(),
  conditions: z.string().nullable(),
  results: z.string().nullable(),
  observationsText: z.string().nullable(),
  tags: z.array(z.string()),
  conductedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const attachmentDtoSchema = z.object({
  id: z.string(),
  experimentId: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  size: z.number(),
  uploadedBy: z.string(),
  createdAt: z.string(),
})

export const versionDtoSchema = z.object({
  id: z.string(),
  experimentId: z.string(),
  createdBy: z.string(),
  createdAt: z.string(),
  snapshot: z.record(z.string(), z.unknown()),
})

export const projectsListSchema = z.array(projectDtoSchema)

export const projectMemberDtoSchema = z.object({
  userId: z.string(),
  email: z.string(),
  displayName: z.string(),
  role: z.enum(['owner', 'editor', 'viewer']),
})

export const projectMembersListSchema = z.array(projectMemberDtoSchema)

export const deleteOkSchema = z.object({ ok: z.literal(true) })
export const experimentsListSchema = z.array(experimentDtoSchema)
export const attachmentsListSchema = z.array(attachmentDtoSchema)
export const versionsListSchema = z.array(versionDtoSchema)

export const commentDtoSchema = z.object({
  id: z.string(),
  experimentId: z.string(),
  authorId: z.string(),
  authorDisplayName: z.string(),
  body: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const commentsListSchema = z.array(commentDtoSchema)

export const workspaceNodeDtoSchema: z.ZodType<{
  id: string
  projectId: string
  parentId: string | null
  type: z.infer<typeof projectNodeTypeSchema>
  title: string
  sortOrder: number
  pageId: string | null
  experimentId: string | null
  experimentStatus: z.infer<typeof experimentStatusSchema> | null
  children: unknown[]
}> = z.lazy(() =>
  z.object({
    id: z.string(),
    projectId: z.string(),
    parentId: z.string().nullable(),
    type: projectNodeTypeSchema,
    title: z.string(),
    sortOrder: z.number(),
    pageId: z.string().nullable(),
    experimentId: z.string().nullable(),
    experimentStatus: experimentStatusSchema.nullable(),
    children: z.array(workspaceNodeDtoSchema),
  }),
)

export const workspaceTreeSchema = z.array(workspaceNodeDtoSchema)

export const projectPageDtoSchema = z.object({
  id: z.string(),
  nodeId: z.string(),
  projectId: z.string(),
  title: z.string(),
  bodyHtml: z.string(),
  authorId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const pageVersionsListSchema = z.array(
  z.object({
    id: z.string(),
    pageId: z.string(),
    createdBy: z.string(),
    createdAt: z.string(),
    snapshot: z.object({
      title: z.string(),
      bodyHtml: z.string(),
    }),
  }),
)

export const workspaceSearchResultSchema = z.object({
  pages: z.array(
    z.object({
      id: z.string(),
      nodeId: z.string(),
      title: z.string(),
    }),
  ),
  experiments: z.array(
    z.object({
      id: z.string(),
      nodeId: z.string(),
      title: z.string(),
    }),
  ),
})
