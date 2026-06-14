import type { ProjectPageDto, ProjectPageSnapshot } from '@labcollab/shared';
import type { projectNodes, projectPages } from '../db/schema';

type PageRow = typeof projectPages.$inferSelect;
type NodeRow = typeof projectNodes.$inferSelect;

export function toProjectPageDto(page: PageRow, node: NodeRow): ProjectPageDto {
  return {
    id: page.id,
    nodeId: page.nodeId,
    projectId: page.projectId,
    title: node.title,
    bodyHtml: page.bodyHtml,
    authorId: node.authorId,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
  };
}

export function pageToSnapshot(dto: ProjectPageDto): ProjectPageSnapshot {
  return {
    title: dto.title,
    bodyHtml: dto.bodyHtml,
  };
}
