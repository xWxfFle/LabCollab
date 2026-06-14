import type { ExperimentStatus, ProjectNodeType, ProjectRole } from './index';

export interface UserDto {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}
export interface AuthResponse {
  accessToken: string;
  user: UserDto;
}

export interface ProjectDto {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  role: ProjectRole;
  createdAt: string;
}

export interface ProjectMemberDto {
  userId: string;
  email: string;
  displayName: string;
  role: ProjectRole;
}

export interface ExperimentDto {
  id: string;
  projectId: string;
  authorId: string;
  authorDisplayName: string | null;
  title: string;
  status: ExperimentStatus;
  hypothesis: string | null;
  objective: string;
  materials: string | null;
  protocolSteps: string | null;
  conditions: string | null;
  results: string | null;
  observationsText: string | null;
  tags: string[];
  conductedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExperimentVersionDto {
  id: string;
  experimentId: string;
  createdBy: string;
  createdAt: string;
  snapshot: ExperimentSnapshot;
}

/** Снапшот записи на момент сохранения версии */
export type ExperimentSnapshot = Pick<
  ExperimentDto,
  | 'title'
  | 'status'
  | 'hypothesis'
  | 'objective'
  | 'materials'
  | 'protocolSteps'
  | 'conditions'
  | 'results'
  | 'observationsText'
  | 'tags'
  | 'conductedAt'
>;

export interface AttachmentDto {
  id: string;
  experimentId: string;
  filename: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  createdAt: string;
}

export interface CommentDto {
  id: string;
  experimentId: string;
  authorId: string;
  authorDisplayName: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceNodeDto {
  id: string;
  projectId: string;
  parentId: string | null;
  type: ProjectNodeType;
  title: string;
  sortOrder: number;
  pageId: string | null;
  experimentId: string | null;
  experimentStatus: ExperimentStatus | null;
  children: WorkspaceNodeDto[];
}

export interface ProjectPageDto {
  id: string;
  nodeId: string;
  projectId: string;
  title: string;
  bodyHtml: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export type ProjectPageSnapshot = Pick<ProjectPageDto, 'title' | 'bodyHtml'>;

export interface ProjectPageVersionDto {
  id: string;
  pageId: string;
  createdBy: string;
  createdAt: string;
  snapshot: ProjectPageSnapshot;
}

export interface WorkspaceSearchResultDto {
  pages: Array<{ id: string; nodeId: string; title: string }>;
  experiments: Array<{ id: string; nodeId: string; title: string }>;
}

export interface SyncAuthorizeResponse {
  allowed: boolean;
  userId?: string;
  role?: ProjectRole;
  displayName?: string;
}
