import type { Buffer } from 'node:buffer'
import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces'
import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { experiments, projects } from '../../db/schema'
import { toExperimentDto } from '../../lib/mappers'
import { canReadExperiment } from '../../lib/rbac'
import { pdfmake } from './pdf-fonts'

export async function buildExperimentPdf(
  experimentId: string,
  userId: string,
  observationsText = '',
): Promise<Buffer> {
  if (!(await canReadExperiment(userId, experimentId))) {
    throw new Error('Forbidden')
  }

  const [row] = await db.select().from(experiments).where(eq(experiments.id, experimentId)).limit(1)
  if (!row)
    throw new Error('Not found')

  const [project] = await db.select().from(projects).where(eq(projects.id, row.projectId)).limit(1)
  const dto = toExperimentDto(row)

  const content: Content[] = [
    { text: 'LabCollab — отчёт эксперимента', style: 'header' },
    { text: `Проект: ${project?.name ?? ''}`, margin: [0, 8, 0, 4] },
    { text: `Дата экспорта: ${new Date().toLocaleString('ru-RU')}`, margin: [0, 0, 0, 16] },
    { text: dto.title, style: 'subheader' },
    { text: `Статус: ${dto.status}` },
    { text: `Цель: ${dto.objective}`, margin: [0, 8, 0, 0] },
  ]

  if (dto.hypothesis)
    content.push({ text: `Гипотеза: ${dto.hypothesis}`, margin: [0, 4, 0, 0] })
  if (dto.materials)
    content.push({ text: `Материалы: ${dto.materials}`, margin: [0, 4, 0, 0] })
  if (dto.protocolSteps)
    content.push({ text: `Протокол: ${dto.protocolSteps}`, margin: [0, 4, 0, 0] })
  if (dto.conditions)
    content.push({ text: `Условия: ${dto.conditions}`, margin: [0, 4, 0, 0] })
  if (dto.results)
    content.push({ text: `Результаты: ${dto.results}`, margin: [0, 4, 0, 0] })
  if (observationsText) {
    content.push({
      text: `Наблюдения:\n${observationsText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}`,
      margin: [0, 8, 0, 0],
    })
  }

  const docDefinition: TDocumentDefinitions = {
    content,
    styles: {
      header: { fontSize: 18, bold: true },
      subheader: { fontSize: 14, bold: true, margin: [0, 12, 0, 4] },
    },
    defaultStyle: { font: 'Roboto', fontSize: 11 },
  }

  return pdfmake.createPdf(docDefinition).getBuffer()
}
