import { eq } from 'drizzle-orm';
import pdfmake from 'pdfmake';
import type { TDocumentDefinitions, Content } from 'pdfmake/interfaces';
import { db } from '../../db';
import { projectPages, projectNodes, projects } from '../../db/schema';
import { htmlToMarkdown, stripHtml } from '../../lib/html-text';
import { toProjectPageDto } from '../../lib/page-mappers';
import { canReadProject } from '../../lib/rbac';

pdfmake.setFonts({
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
});

async function loadPageForExport(pageId: string, userId: string) {
  const [row] = await db
    .select({ page: projectPages, node: projectNodes })
    .from(projectPages)
    .innerJoin(projectNodes, eq(projectNodes.id, projectPages.nodeId))
    .where(eq(projectPages.id, pageId))
    .limit(1);

  if (!row) return null;
  if (!(await canReadProject(userId, row.page.projectId))) return null;

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, row.page.projectId))
    .limit(1);

  return {
    dto: toProjectPageDto(row.page, row.node),
    projectName: project?.name ?? '',
  };
}

export async function buildPagePdf(pageId: string, userId: string): Promise<Buffer> {
  const data = await loadPageForExport(pageId, userId);
  if (!data) throw new Error('Not found');

  const { dto, projectName } = data;
  const bodyText = stripHtml(dto.bodyHtml);

  const content: Content[] = [
    { text: 'LabCollab — страница документации', style: 'header' },
    { text: `Проект: ${projectName}`, margin: [0, 8, 0, 4] },
    { text: `Дата экспорта: ${new Date().toLocaleString('ru-RU')}`, margin: [0, 0, 0, 16] },
    { text: dto.title, style: 'subheader' },
    { text: bodyText, margin: [0, 8, 0, 0] },
  ];

  const docDefinition: TDocumentDefinitions = {
    content,
    styles: {
      header: { fontSize: 18, bold: true },
      subheader: { fontSize: 14, bold: true, margin: [0, 12, 0, 4] },
    },
    defaultStyle: { font: 'Roboto', fontSize: 11 },
  };

  return pdfmake.createPdf(docDefinition).getBuffer();
}

export async function buildPageMarkdown(pageId: string, userId: string): Promise<string> {
  const data = await loadPageForExport(pageId, userId);
  if (!data) throw new Error('Not found');

  const { dto, projectName } = data;
  const body = htmlToMarkdown(dto.bodyHtml);

  return [
    `# ${dto.title}`,
    '',
    `> Проект: ${projectName}`,
    `> Экспорт: ${new Date().toLocaleString('ru-RU')}`,
    '',
    body,
    '',
  ].join('\n');
}
