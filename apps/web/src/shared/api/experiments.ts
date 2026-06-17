import type { CreateExperimentInput, ExperimentStatus, UpdateExperimentInput } from '@labcollab/shared'
import {
  createJsonMutation,
  createJsonQuery,
  declareParams,
  unknownContract,
} from '@farfetched/core'
import { zodContract } from '@farfetched/zod'
import { getAuthHeaders } from './base'
import {
  attachmentsListSchema,
  experimentDtoSchema,
  experimentsListSchema,
  versionsListSchema,
} from './contracts'

type CreateExperimentParams = { projectId: string } & CreateExperimentInput
type PatchExperimentParams = { id: string } & UpdateExperimentInput

interface ListExperimentsParams {
  projectId: string
  status?: ExperimentStatus
  q?: string
}

function experimentsListUrl({ projectId, status, q }: ListExperimentsParams) {
  const search = new URLSearchParams()
  if (status)
    search.set('status', status)
  if (q)
    search.set('q', q)
  const qs = search.toString()
  return `/api/projects/${projectId}/experiments${qs ? `?${qs}` : ''}`
}

export const experimentsQuery = createJsonQuery({
  name: 'experiments',
  params: declareParams<ListExperimentsParams>(),
  request: {
    method: 'GET',
    url: experimentsListUrl,
    headers: getAuthHeaders,
  },
  response: { contract: zodContract(experimentsListSchema) },
})

export const experimentQuery = createJsonQuery({
  name: 'experiment',
  params: declareParams<{ id: string }>(),
  request: {
    method: 'GET',
    url: ({ id }) => `/api/experiments/${id}`,
    headers: getAuthHeaders,
  },
  response: { contract: zodContract(experimentDtoSchema) },
})

export const createExperimentMutation = createJsonMutation({
  name: 'createExperiment',
  params: declareParams<CreateExperimentParams>(),
  request: {
    method: 'POST',
    url: params => `/api/projects/${params.projectId}/experiments`,
    body: params => ({
      title: params.title,
      parentNodeId: params.parentNodeId,
      templateId: params.templateId,
      status: params.status,
      tags: params.tags,
      conductedAt: params.conductedAt,
    }),
    headers: getAuthHeaders,
  },
  response: { contract: zodContract(experimentDtoSchema) },
})

export const patchExperimentMutation = createJsonMutation({
  name: 'patchExperiment',
  params: declareParams<PatchExperimentParams>(),
  request: {
    method: 'PATCH',
    url: params => `/api/experiments/${params.id}`,
    body: (params) => {
      const { id: _id, ...body } = params
      return body
    },
    headers: getAuthHeaders,
  },
  response: { contract: zodContract(experimentDtoSchema) },
})

export const deleteExperimentMutation = createJsonMutation({
  name: 'deleteExperiment',
  params: declareParams<{ id: string }>(),
  request: {
    method: 'DELETE',
    url: params => `/api/experiments/${params.id}`,
    headers: getAuthHeaders,
  },
  response: { contract: unknownContract },
})

export const versionsQuery = createJsonQuery({
  name: 'versions',
  params: declareParams<{ experimentId: string }>(),
  request: {
    method: 'GET',
    url: ({ experimentId }) => `/api/experiments/${experimentId}/versions`,
    headers: getAuthHeaders,
  },
  response: { contract: zodContract(versionsListSchema) },
})

export const attachmentsQuery = createJsonQuery({
  name: 'attachments',
  params: declareParams<{ experimentId: string }>(),
  request: {
    method: 'GET',
    url: ({ experimentId }) => `/api/experiments/${experimentId}/attachments`,
    headers: getAuthHeaders,
  },
  response: { contract: zodContract(attachmentsListSchema) },
})
