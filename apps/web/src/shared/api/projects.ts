import type { AddMemberInput, CreateProjectInput, UpdateMemberRoleInput, UpdateProjectInput } from '@labcollab/shared'
import {
  createJsonMutation,
  createJsonQuery,
  declareParams,
} from '@farfetched/core'
import { zodContract } from '@farfetched/zod'
import { getAuthHeaders } from './base'
import {
  deleteOkSchema,
  projectDtoSchema,
  projectMemberDtoSchema,
  projectMembersListSchema,
  projectsListSchema,
} from './contracts'

interface AddMemberParams extends AddMemberInput {
  projectId: string
}
interface UpdateProjectParams extends UpdateProjectInput {
  projectId: string
}
interface UpdateMemberRoleParams extends UpdateMemberRoleInput {
  projectId: string
  userId: string
}
interface ProjectMemberParams {
  projectId: string
  userId: string
}
interface ProjectParams {
  projectId: string
}

export const projectsQuery = createJsonQuery({
  name: 'projects',
  params: declareParams<void>(),
  request: {
    method: 'GET',
    url: '/api/projects',
    headers: getAuthHeaders,
  },
  response: { contract: zodContract(projectsListSchema) },
})

export const projectQuery = createJsonQuery({
  name: 'project',
  params: declareParams<{ id: string }>(),
  request: {
    method: 'GET',
    url: ({ id }) => `/api/projects/${id}`,
    headers: getAuthHeaders,
  },
  response: { contract: zodContract(projectDtoSchema) },
})

export const projectMembersQuery = createJsonQuery({
  name: 'projectMembers',
  params: declareParams<{ projectId: string }>(),
  request: {
    method: 'GET',
    url: ({ projectId }) => `/api/projects/${projectId}/members`,
    headers: getAuthHeaders,
  },
  response: { contract: zodContract(projectMembersListSchema) },
})

export const createProjectMutation = createJsonMutation({
  name: 'createProject',
  params: declareParams<CreateProjectInput>(),
  request: {
    method: 'POST',
    url: '/api/projects',
    body: params => params,
    headers: getAuthHeaders,
  },
  response: { contract: zodContract(projectDtoSchema) },
})

export const patchProjectMutation = createJsonMutation({
  name: 'patchProject',
  params: declareParams<UpdateProjectParams>(),
  request: {
    method: 'PATCH',
    url: ({ projectId }) => `/api/projects/${projectId}`,
    body: ({ projectId: _, ...body }) => body,
    headers: getAuthHeaders,
  },
  response: { contract: zodContract(projectDtoSchema) },
})

export const deleteProjectMutation = createJsonMutation({
  name: 'deleteProject',
  params: declareParams<ProjectParams>(),
  request: {
    method: 'DELETE',
    url: ({ projectId }) => `/api/projects/${projectId}`,
    headers: getAuthHeaders,
  },
  response: { contract: zodContract(deleteOkSchema) },
})

export const addMemberMutation = createJsonMutation({
  name: 'addMember',
  params: declareParams<AddMemberParams>(),
  request: {
    method: 'POST',
    url: params => `/api/projects/${params.projectId}/members`,
    body: params => ({ email: params.email, role: params.role }),
    headers: getAuthHeaders,
  },
  response: { contract: zodContract(projectMemberDtoSchema) },
})

export const updateMemberRoleMutation = createJsonMutation({
  name: 'updateMemberRole',
  params: declareParams<UpdateMemberRoleParams>(),
  request: {
    method: 'PATCH',
    url: ({ projectId, userId }) => `/api/projects/${projectId}/members/${userId}`,
    body: ({ role }) => ({ role }),
    headers: getAuthHeaders,
  },
  response: { contract: zodContract(projectMemberDtoSchema) },
})

export const removeMemberMutation = createJsonMutation({
  name: 'removeMember',
  params: declareParams<ProjectMemberParams>(),
  request: {
    method: 'DELETE',
    url: ({ projectId, userId }) => `/api/projects/${projectId}/members/${userId}`,
    headers: getAuthHeaders,
  },
  response: { contract: zodContract(deleteOkSchema) },
})
