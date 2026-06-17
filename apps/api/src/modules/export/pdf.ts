import type { Buffer } from 'node:buffer'
import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces'
import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { experiments, projects } from '../../db/schema'
import { experimentStatusLabels } from '../../lib/experiment-status-labels'
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
  const observations = observationsText || dto.observationsText || ''

  const content: Content[] = [
    { text: 'LabCollab — отчёт эксперимента', style: 'header' },
    { text: `Проект: ${project?.name ?? ''}`, margin: [0, 8, 0, 4] },
    { text: `Дата экспорта: ${new Date().toLocaleString('ru-RU')}`, margin: [0, 0, 0, 16] },
    { text: dto.title, style: 'subheader' },
    { text: `Статус: ${experimentStatusLabels[dto.status] ?? dto.status}` },
  ]

  const sortedFields = [...dto.fieldDefinitions].sort((a, b) => a.order - b.order)
  for (const field of sortedFields) {
    const value = dto.fieldValues[field.id]
    if (value) {
      content.push({ text: `${field.label}: ${value}`, margin: [0, 8, 0, 0] })
    }
  }

  if (dto.checklist.length > 0) {
    content.push({ text: 'Чеклист:', margin: [0, 12, 0, 4], bold: true })
    const sortedChecklist = [...dto.checklist].sort((a, b) => a.order - b.order)
    for (const item of sortedChecklist) {
      const mark = item.done ? '[x]' : '[ ]'
      content.push({ text: `${mark} ${item.text}`, margin: [0, 2, 0, 0] })
    }
  }

  if (observations) {
    content.push({
      text: `Наблюдения:\n${observations.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}`,
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
