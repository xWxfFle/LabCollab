import {
  createJsonMutation,
  createJsonQuery,
  declareParams,
} from '@farfetched/core';
import { zodContract } from '@farfetched/zod';
import type { AddMemberInput, CreateProjectInput } from '@labcollab/shared';
import { getAuthHeaders } from './base';
import { projectDtoSchema, projectsListSchema } from './contracts';

type AddMemberParams = { projectId: string } & AddMemberInput;

export const projectsQuery = createJsonQuery({
  name: 'projects',
  params: declareParams<void>(),
  request: {
    method: 'GET',
    url: '/api/projects',
    headers: getAuthHeaders,
  },
  response: { contract: zodContract(projectsListSchema) },
});

export const projectQuery = createJsonQuery({
  name: 'project',
  params: declareParams<{ id: string }>(),
  request: {
    method: 'GET',
    url: ({ id }) => `/api/projects/${id}`,
    headers: getAuthHeaders,
  },
  response: { contract: zodContract(projectDtoSchema) },
});

export const createProjectMutation = createJsonMutation({
  name: 'createProject',
  params: declareParams<CreateProjectInput>(),
  request: {
    method: 'POST',
    url: '/api/projects',
    body: (params) => params,
    headers: getAuthHeaders,
  },
  response: { contract: zodContract(projectDtoSchema) },
});

export const addMemberMutation = createJsonMutation({
  name: 'addMember',
  params: declareParams<AddMemberParams>(),
  request: {
    method: 'POST',
    url: (params) => `/api/projects/${params.projectId}/members`,
    body: (params) => ({ email: params.email, role: params.role }),
    headers: getAuthHeaders,
  },
  response: { contract: zodContract(projectDtoSchema) },
});
