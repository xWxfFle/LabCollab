export const APP_NAME = 'LabCollab' as const;
export const API_VERSION = 'v1' as const;

export type ProjectRole = 'owner' | 'editor' | 'viewer';
export type ExperimentStatus = 'draft' | 'in_progress' | 'completed';
export type ProjectNodeType = 'folder' | 'page' | 'experiment';

export interface HealthResponse {
  status: 'ok';
  service: string;
}

export * from './schemas';
export * from './types';
