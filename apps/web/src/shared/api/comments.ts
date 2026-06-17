import type { CreateCommentInput } from '@labcollab/shared'
import {
  createJsonMutation,
  createJsonQuery,
  declareParams,
} from '@farfetched/core'
import { zodContract } from '@farfetched/zod'
import { z } from 'zod'
import { getAuthHeaders } from './base'
import { commentDtoSchema, commentsListSchema } from './contracts'

type CreateCommentParams = { experimentId: string } & CreateCommentInput

const deleteCommentResponseSchema = z.object({ ok: z.literal(true) })

export const commentsQuery = createJsonQuery({
  name: 'comments',
  params: declareParams<{ experimentId: string }>(),
  request: {
    method: 'GET',
    url: ({ experimentId }) => `/api/experiments/${experimentId}/comments`,
    headers: getAuthHeaders,
  },
  response: { contract: zodContract(commentsListSchema) },
})

export const createCommentMutation = createJsonMutation({
  name: 'createComment',
  params: declareParams<CreateCommentParams>(),
  request: {
    method: 'POST',
    url: params => `/api/experiments/${params.experimentId}/comments`,
    body: params => ({ body: params.body }),
    headers: getAuthHeaders,
  },
  response: { contract: zodContract(commentDtoSchema) },
})

export const deleteCommentMutation = createJsonMutation({
  name: 'deleteComment',
  params: declareParams<{ id: string }>(),
  request: {
    method: 'DELETE',
    url: params => `/api/comments/${params.id}`,
    headers: getAuthHeaders,
  },
  response: { contract: zodContract(deleteCommentResponseSchema) },
})
