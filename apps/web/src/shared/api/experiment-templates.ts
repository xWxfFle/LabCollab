import type {
  CreateExperimentTemplateInput,
  UpdateExperimentTemplateInput,
} from '@labcollab/shared'
import { createJsonMutation, createJsonQuery, declareParams } from '@farfetched/core'
import { zodContract } from '@farfetched/zod'
import { getAuthHeaders } from './base'
import { deleteOkSchema, experimentTemplateDtoSchema, experimentTemplatesListSchema } from './contracts'

type CreateUserTemplateParams = CreateExperimentTemplateInput
type CreateProjectTemplateParams = { projectId: string } & CreateExperimentTemplateInput
type UpdateTemplateParams = { id: string } & UpdateExperimentTemplateInput

export const userExperimentTemplatesQuery = createJsonQuery({
  name: 'userExperimentTemplates',
  request: {
    method: 'GET',
    url: '/api/users/me/experiment-templates',
    headers: getAuthHeaders,
  },
  response: { contract: zodContract(experimentTemplatesListSchema) },
})

export const projectExperimentTemplatesQuery = createJsonQuery({
  name: 'projectExperimentTemplates',
  params: declareParams<{ projectId: string }>(),
  request: {
    method: 'GET',
    url: ({ projectId }) => `/api/projects/${projectId}/experiment-templates`,
    headers: getAuthHeaders,
  },
  response: { contract: zodContract(experimentTemplatesListSchema) },
})

export const createUserExperimentTemplateMutation = createJsonMutation({
  name: 'createUserExperimentTemplate',
  params: declareParams<CreateUserTemplateParams>(),
  request: {
    method: 'POST',
    url: '/api/users/me/experiment-templates',
    body: params => params,
    headers: getAuthHeaders,
  },
  response: { contract: zodContract(experimentTemplateDtoSchema) },
})

export const createProjectExperimentTemplateMutation = createJsonMutation({
  name: 'createProjectExperimentTemplate',
  params: declareParams<CreateProjectTemplateParams>(),
  request: {
    method: 'POST',
    url: params => `/api/projects/${params.projectId}/experiment-templates`,
    body: ({ projectId: _projectId, ...body }) => body,
    headers: getAuthHeaders,
  },
  response: { contract: zodContract(experimentTemplateDtoSchema) },
})

export const copyUserExperimentTemplateToProjectMutation = createJsonMutation({
  name: 'copyUserExperimentTemplateToProject',
  params: declareParams<{ projectId: string, sourceTemplateId: string }>(),
  request: {
    method: 'POST',
    url: params => `/api/projects/${params.projectId}/experiment-templates/copy-from-user`,
    body: ({ sourceTemplateId }) => ({ sourceTemplateId }),
    headers: getAuthHeaders,
  },
  response: { contract: zodContract(experimentTemplateDtoSchema) },
})

export const updateExperimentTemplateMutation = createJsonMutation({
  name: 'updateExperimentTemplate',
  params: declareParams<UpdateTemplateParams>(),
  request: {
    method: 'PATCH',
    url: params => `/api/experiment-templates/${params.id}`,
    body: ({ id: _id, ...body }) => body,
    headers: getAuthHeaders,
  },
  response: { contract: zodContract(experimentTemplateDtoSchema) },
})

export const deleteExperimentTemplateMutation = createJsonMutation({
  name: 'deleteExperimentTemplate',
  params: declareParams<{ id: string }>(),
  request: {
    method: 'DELETE',
    url: params => `/api/experiment-templates/${params.id}`,
    headers: getAuthHeaders,
  },
  response: { contract: zodContract(deleteOkSchema) },
})
