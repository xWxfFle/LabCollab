export const APP_NAME = 'LabCollab' as const
export const API_VERSION = 'v1' as const

export type ProjectRole = 'owner' | 'editor' | 'viewer'
export type ExperimentStatus = 'draft' | 'in_progress' | 'completed_success' | 'completed_failure'
export type ExperimentTemplateScope = 'user' | 'project'
export type ProjectNodeType = 'folder' | 'page' | 'experiment'

export interface HealthResponse {
  status: 'ok'
  service: string
}

export * from './experiment-fields'
export * from './experiment-template-constants'
export * from './schemas'
export * from './types'
