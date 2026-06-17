import type { LoginInput, RegisterInput } from '@labcollab/shared'
import {
  createJsonMutation,
  createJsonQuery,
  declareParams,
} from '@farfetched/core'
import { zodContract } from '@farfetched/zod'
import { getAuthHeaders } from './base'
import { authResponseSchema, meResponseSchema } from './contracts'

export const viewerQuery = createJsonQuery({
  name: 'viewer',
  params: declareParams<void>(),
  request: {
    method: 'GET',
    url: '/api/auth/me',
    headers: getAuthHeaders,
  },
  response: { contract: zodContract(meResponseSchema) },
})

export const loginMutation = createJsonMutation({
  name: 'login',
  params: declareParams<LoginInput>(),
  request: {
    method: 'POST',
    url: '/api/auth/login',
    body: params => params,
    headers: { 'Content-Type': 'application/json' },
  },
  response: { contract: zodContract(authResponseSchema) },
})

export const registerMutation = createJsonMutation({
  name: 'register',
  params: declareParams<RegisterInput>(),
  request: {
    method: 'POST',
    url: '/api/auth/register',
    body: params => params,
    headers: { 'Content-Type': 'application/json' },
  },
  response: { contract: zodContract(authResponseSchema) },
})
