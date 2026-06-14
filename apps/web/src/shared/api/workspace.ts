import {
  createJsonMutation,
  createJsonQuery,
  declareParams,
  unknownContract,
} from '@farfetched/core';
import { zodContract } from '@farfetched/zod';
import type {
  CreateFolderInput,
  CreateProjectPageInput,
  ExperimentStatus,
  MoveWorkspaceNodeInput,
  UpdateProjectPageInput,
  UpdateWorkspaceNodeInput,
} from '@labcollab/shared';
import { getAuthHeaders } from './base';
import {
  projectPageDtoSchema,
  pageVersionsListSchema,
  workspaceSearchResultSchema,
  workspaceTreeSchema,
} from './contracts';

export const workspaceQuery = createJsonQuery({
  name: 'workspace',
  params: declareParams<{ projectId: string }>(),
  request: {
    method: 'GET',
    url: ({ projectId }) => `/api/projects/${projectId}/workspace`,
    headers: getAuthHeaders,
  },
  response: { contract: zodContract(workspaceTreeSchema) },
});

export const workspaceSearchQuery = createJsonQuery({
  name: 'workspaceSearch',
  params: declareParams<{ projectId: string; q: string }>(),
  request: {
    method: 'GET',
    url: ({ projectId, q }) =>
      `/api/projects/${projectId}/search?${new URLSearchParams({ q }).toString()}`,
    headers: getAuthHeaders,
  },
  response: { contract: zodContract(workspaceSearchResultSchema) },
});

export const projectPageQuery = createJsonQuery({
  name: 'projectPage',
  params: declareParams<{ id: string }>(),
  request: {
    method: 'GET',
    url: ({ id }) => `/api/pages/${id}`,
    headers: getAuthHeaders,
  },
  response: { contract: zodContract(projectPageDtoSchema) },
});

export const createFolderMutation = createJsonMutation({
  name: 'createFolder',
  params: declareParams<{ projectId: string } & CreateFolderInput>(),
  request: {
    method: 'POST',
    url: (params) => `/api/projects/${params.projectId}/folders`,
    body: (params) => ({
      title: params.title,
      parentId: params.parentId,
    }),
    headers: getAuthHeaders,
  },
  response: { contract: unknownContract },
});

export const createPageMutation = createJsonMutation({
  name: 'createPage',
  params: declareParams<{ projectId: string } & CreateProjectPageInput>(),
  request: {
    method: 'POST',
    url: (params) => `/api/projects/${params.projectId}/pages`,
    body: (params) => ({
      title: params.title,
      parentId: params.parentId,
    }),
    headers: getAuthHeaders,
  },
  response: { contract: zodContract(projectPageDtoSchema) },
});

export const patchPageMutation = createJsonMutation({
  name: 'patchPage',
  params: declareParams<{ id: string } & UpdateProjectPageInput>(),
  request: {
    method: 'PATCH',
    url: (params) => `/api/pages/${params.id}`,
    body: (params) => {
      const { id: _id, ...body } = params;
      return body;
    },
    headers: getAuthHeaders,
  },
  response: { contract: zodContract(projectPageDtoSchema) },
});

export const patchWorkspaceNodeMutation = createJsonMutation({
  name: 'patchWorkspaceNode',
  params: declareParams<{ id: string } & UpdateWorkspaceNodeInput>(),
  request: {
    method: 'PATCH',
    url: (params) => `/api/workspace/nodes/${params.id}`,
    body: (params) => {
      const { id: _id, ...body } = params;
      return body;
    },
    headers: getAuthHeaders,
  },
  response: { contract: unknownContract },
});

export const moveWorkspaceNodeMutation = createJsonMutation({
  name: 'moveWorkspaceNode',
  params: declareParams<{ id: string } & MoveWorkspaceNodeInput>(),
  request: {
    method: 'PATCH',
    url: (params) => `/api/workspace/nodes/${params.id}/move`,
    body: (params) => {
      const { id: _id, ...body } = params;
      return body;
    },
    headers: getAuthHeaders,
  },
  response: { contract: unknownContract },
});

export const deleteWorkspaceNodeMutation = createJsonMutation({
  name: 'deleteWorkspaceNode',
  params: declareParams<{ id: string }>(),
  request: {
    method: 'DELETE',
    url: (params) => `/api/workspace/nodes/${params.id}`,
    headers: getAuthHeaders,
  },
  response: { contract: unknownContract },
});

export const pageVersionsQuery = createJsonQuery({
  name: 'pageVersions',
  params: declareParams<{ pageId: string }>(),
  request: {
    method: 'GET',
    url: ({ pageId }) => `/api/pages/${pageId}/versions`,
    headers: getAuthHeaders,
  },
  response: { contract: zodContract(pageVersionsListSchema) },
});

export type WorkspaceStatusFilter = ExperimentStatus | 'all';
