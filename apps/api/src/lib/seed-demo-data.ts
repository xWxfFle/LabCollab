import type {
  ExperimentChecklistItem,
  ExperimentFieldDefinition,
  ExperimentTemplateFieldSeed,
  TemplateChecklistItemSeed,
} from '@labcollab/shared'
import { defaultExperimentTemplateSeed } from '@labcollab/shared'
import { and, eq, like } from 'drizzle-orm'
import { db } from '../db'
import {
  experimentComments,
  experiments,
  experimentTemplates,
  experimentVersions,
  projectMembers,
  projectNodes,
  projectPages,
  projectPageVersions,
  projects,
} from '../db/schema'
import {
  assignFieldIds,
  buildChecklistFromSeed,
  buildFieldValues,
} from './experiment-fields'
import { seedDefaultProjectExperimentTemplate } from './experiment-template-seed'
import { experimentToSnapshot } from './mappers'
import { pageToSnapshot, toProjectPageDto } from './page-mappers'

export const DEMO_SEED_MARKER = 'demo-seed-v2'

export interface DemoUserIds {
  aliceId: string
  bobId: string
  carolId: string
}

function fieldValuesByLabels(
  definitions: ExperimentFieldDefinition[],
  labels: Record<string, string>,
): Record<string, string> {
  const values = buildFieldValues(definitions)
  for (const field of definitions) {
    const value = labels[field.label]
    if (value !== undefined)
      values[field.id] = value
  }
  return values
}

function markChecklistDone(
  checklist: ExperimentChecklistItem[],
  doneOrders: number[],
): ExperimentChecklistItem[] {
  const done = new Set(doneOrders)
  return checklist.map(item => ({ ...item, done: done.has(item.order) }))
}

async function insertUserTemplate(
  userId: string,
  name: string,
  fieldSeeds: ExperimentTemplateFieldSeed[],
  checklistSeeds: TemplateChecklistItemSeed[] = [],
  defaultObservations: string | null = null,
) {
  const fieldDefinitions = assignFieldIds(fieldSeeds)
  await db.insert(experimentTemplates).values({
    name,
    scope: 'user',
    userId,
    projectId: null,
    fieldDefinitions,
    defaultObservations,
    defaultChecklist: checklistSeeds,
  })
  return fieldDefinitions
}

async function insertProjectTemplate(
  projectId: string,
  name: string,
  fieldSeeds: ExperimentTemplateFieldSeed[],
  checklistSeeds: TemplateChecklistItemSeed[] = [],
  defaultObservations: string | null = null,
) {
  const fieldDefinitions = assignFieldIds(fieldSeeds)
  const [row] = await db
    .insert(experimentTemplates)
    .values({
      name,
      scope: 'project',
      userId: null,
      projectId,
      fieldDefinitions,
      defaultObservations,
      defaultChecklist: checklistSeeds,
    })
    .returning()
  return { template: row, fieldDefinitions }
}

async function insertExperiment(params: {
  projectId: string
  authorId: string
  templateId: string | null
  title: string
  status: typeof experiments.$inferSelect.status
  fieldDefinitions: ExperimentFieldDefinition[]
  fieldValues: Record<string, string>
  checklist: ExperimentChecklistItem[]
  observationsHtml: string | null
  tags: string[]
  parentNodeId: string | null
  sortOrder?: number
  extraVersions?: Array<{ observationsHtml: string, fieldValues?: Record<string, string> }>
}) {
  const [row] = await db
    .insert(experiments)
    .values({
      projectId: params.projectId,
      authorId: params.authorId,
      templateId: params.templateId,
      title: params.title,
      status: params.status,
      fieldDefinitions: params.fieldDefinitions,
      fieldValues: params.fieldValues,
      checklist: params.checklist,
      observationsYjsState: params.observationsHtml,
      tags: params.tags,
    })
    .returning()

  await db.insert(experimentVersions).values({
    experimentId: row.id,
    createdBy: params.authorId,
    snapshotJson: experimentToSnapshot(row, row.observationsYjsState ?? ''),
  })

  for (const version of params.extraVersions ?? []) {
    const patched = {
      ...row,
      fieldValues: version.fieldValues ?? row.fieldValues,
      observationsYjsState: version.observationsHtml,
    }
    await db.insert(experimentVersions).values({
      experimentId: row.id,
      createdBy: params.authorId,
      snapshotJson: experimentToSnapshot(patched, version.observationsHtml),
    })
  }

  const sortOrder = params.sortOrder ?? 0
  const parentCheck = params.parentNodeId
  const [node] = await db
    .insert(projectNodes)
    .values({
      projectId: params.projectId,
      parentId: parentCheck,
      nodeType: 'experiment',
      title: params.title,
      sortOrder,
      experimentId: row.id,
      authorId: params.authorId,
    })
    .returning()

  return { experiment: row, node }
}

async function insertFolder(params: {
  projectId: string
  authorId: string
  title: string
  parentId: string | null
  sortOrder: number
}) {
  const [node] = await db
    .insert(projectNodes)
    .values({
      projectId: params.projectId,
      parentId: params.parentId,
      nodeType: 'folder',
      title: params.title,
      sortOrder: params.sortOrder,
      authorId: params.authorId,
    })
    .returning()
  return node
}

async function insertPage(params: {
  projectId: string
  authorId: string
  title: string
  parentId: string | null
  sortOrder: number
  bodyHtml: string
}) {
  const [node] = await db
    .insert(projectNodes)
    .values({
      projectId: params.projectId,
      parentId: params.parentId,
      nodeType: 'page',
      title: params.title,
      sortOrder: params.sortOrder,
      authorId: params.authorId,
    })
    .returning()

  const [page] = await db
    .insert(projectPages)
    .values({
      nodeId: node.id,
      projectId: params.projectId,
      bodyHtml: params.bodyHtml,
    })
    .returning()

  const dto = toProjectPageDto(page, node)
  await db.insert(projectPageVersions).values({
    pageId: page.id,
    createdBy: params.authorId,
    snapshotJson: pageToSnapshot(dto),
  })

  return { node, page }
}

async function seedCatalystsProject(ids: DemoUserIds) {
  const [project] = await db
    .insert(projects)
    .values({
      name: 'НИР: катализаторы',
      description: `Исследование окислительных катализаторов. ${DEMO_SEED_MARKER}`,
      ownerId: ids.aliceId,
    })
    .returning()

  await db.insert(projectMembers).values([
    { projectId: project.id, userId: ids.aliceId, role: 'owner' },
    { projectId: project.id, userId: ids.bobId, role: 'editor' },
    { projectId: project.id, userId: ids.carolId, role: 'viewer' },
  ])

  await seedDefaultProjectExperimentTemplate(project.id)

  const catalysisChecklist: TemplateChecklistItemSeed[] = [
    { text: 'Проверить чистоту реагентов', order: 0 },
    { text: 'Откалибровать оборудование', order: 1 },
    { text: 'Зафиксировать условия опыта', order: 2 },
    { text: 'Сохранить сырые данные', order: 3 },
  ]

  const { template: catalysisTemplate, fieldDefinitions: catalysisFields }
    = await insertProjectTemplate(
      project.id,
      'Каталитический синтез',
      [
        { label: 'Цель', required: true, order: 0 },
        { label: 'Гипотеза', required: false, order: 1 },
        { label: 'Материалы', required: false, order: 2 },
        { label: 'Протокол', required: false, order: 3 },
        { label: 'Условия', required: false, order: 4 },
        { label: 'Результаты', required: false, order: 5 },
      ],
      catalysisChecklist,
      '<p><strong>Ход эксперимента</strong></p><ul><li>Записывайте наблюдения по ходу работы</li></ul>',
    )

  const protocolsFolder = await insertFolder({
    projectId: project.id,
    authorId: ids.aliceId,
    title: 'Протоколы и методики',
    parentId: null,
    sortOrder: 0,
  })

  const experimentsFolder = await insertFolder({
    projectId: project.id,
    authorId: ids.aliceId,
    title: 'Эксперименты Q2',
    parentId: null,
    sortOrder: 1,
  })

  await insertPage({
    projectId: project.id,
    authorId: ids.aliceId,
    title: 'Обзор литературы',
    parentId: protocolsFolder.id,
    sortOrder: 0,
    bodyHtml: `
      <h2>Ключевые источники</h2>
      <p>Обзор работ по окислению спиртов на оксидах переходных металлов.</p>
      <ul>
        <li>Mallat et al. — selective oxidation on Ru catalysts</li>
        <li>Иванов А.П. — катализаторы Ni на Al<sub>2</sub>O<sub>3</sub></li>
      </ul>
      <p><em>Обновлено для демо workspace.</em></p>
    `.trim(),
  })

  await insertPage({
    projectId: project.id,
    authorId: ids.bobId,
    title: 'Лабораторный журнал',
    parentId: protocolsFolder.id,
    sortOrder: 1,
    bodyHtml: `
      <h2>Общие правила</h2>
      <ol>
        <li>Все опыты фиксируются в ELN до ухода из лаборатории.</li>
        <li>Фото пробирок прикладываются к записи эксперимента.</li>
        <li>Статус <code>completed_success</code> — только после проверки руководителем.</li>
      </ol>
    `.trim(),
  })

  const checklistRu = markChecklistDone(buildChecklistFromSeed(catalysisChecklist), [0, 1])

  const { experiment: expRu } = await insertExperiment({
    projectId: project.id,
    authorId: ids.aliceId,
    templateId: catalysisTemplate.id,
    title: 'Окисление этанола на Ru/C',
    status: 'in_progress',
    fieldDefinitions: catalysisFields,
    fieldValues: fieldValuesByLabels(catalysisFields, {
      Цель: 'Проверить активность Ru/C при 60 °C',
      Гипотеза: 'Конверсия этанола превысит 40% за 2 ч',
      Материалы: 'Ru/C 5 wt%, этанол 96%, O₂',
      Протокол: '1. Загрузка катализатора\n2. Подача реагентов\n3. Отбор проб каждые 30 мин',
      Условия: 'T = 60 °C, P = 1 атм, 120 мин',
    }),
    checklist: checklistRu,
    observationsHtml:
      '<p>Катализатор загружен, реактор герметичен. <strong>Через 30 мин</strong> — лёгкое потемнение гранул.</p>',
    tags: ['катализ', 'q2-2026', 'ru'],
    parentNodeId: experimentsFolder.id,
    sortOrder: 0,
    extraVersions: [
      {
        observationsHtml:
          '<p>Начальная запись: подготовка реактора завершена.</p>',
      },
    ],
  })

  await insertExperiment({
    projectId: project.id,
    authorId: ids.bobId,
    templateId: catalysisTemplate.id,
    title: 'Скрининг поддержек Al₂O₃ vs SiO₂',
    status: 'draft',
    fieldDefinitions: catalysisFields,
    fieldValues: fieldValuesByLabels(catalysisFields, {
      Цель: 'Сравнить дисперсию Ni на разных носителях',
      Материалы: 'Ni(NO₃)₂, Al₂O₃, SiO₂',
    }),
    checklist: buildChecklistFromSeed(catalysisChecklist),
    observationsHtml: '<p>Черновик — планируется на следующей неделе.</p>',
    tags: ['катализ', 'скрининг'],
    parentNodeId: experimentsFolder.id,
    sortOrder: 1,
  })

  const { experiment: expNi } = await insertExperiment({
    projectId: project.id,
    authorId: ids.aliceId,
    templateId: catalysisTemplate.id,
    title: 'Контрольный прогон Ni/Al₂O₃',
    status: 'completed_success',
    fieldDefinitions: catalysisFields,
    fieldValues: fieldValuesByLabels(catalysisFields, {
      Цель: 'Контроль воспроизводимости базового протокола',
      Гипотеза: 'Конверсия в пределах ±5% от эталонного прогона',
      Материалы: 'Ni/Al₂O₃ 10 wt%, этанол',
      Протокол: 'Стандартный протокол v3 из папки «Протоколы»',
      Условия: 'T = 55 °C, 90 мин',
      Результаты: 'Конверсия 38.2% — в пределах допуска',
    }),
    checklist: markChecklistDone(buildChecklistFromSeed(catalysisChecklist), [0, 1, 2, 3]),
    observationsHtml:
      '<p>Опыт завершён без отклонений. <em>Готово к экспорту в PDF.</em></p>',
    tags: ['катализ', 'контроль', 'q2-2026'],
    parentNodeId: null,
    sortOrder: 2,
  })

  await db.insert(experimentComments).values([
    {
      experimentId: expRu.id,
      authorId: ids.carolId,
      body: 'Проверьте, пожалуйста, единицы измерения в поле «Условия».',
    },
    {
      experimentId: expNi.id,
      authorId: ids.carolId,
      body: 'Протокол воспроизводим, можно включать в отчёт НИР.',
    },
  ])

  return project.id
}

async function seedSpectroscopyProject(ids: DemoUserIds) {
  const [project] = await db
    .insert(projects)
    .values({
      name: 'Спектроскопия полимеров',
      description: `Демо второго проекта (другой владелец). ${DEMO_SEED_MARKER}`,
      ownerId: ids.bobId,
    })
    .returning()

  await db.insert(projectMembers).values([
    { projectId: project.id, userId: ids.bobId, role: 'owner' },
    { projectId: project.id, userId: ids.aliceId, role: 'editor' },
  ])

  await seedDefaultProjectExperimentTemplate(project.id)

  const { template, fieldDefinitions } = await insertProjectTemplate(
    project.id,
    'ИК-спектроскопия',
    [
      { label: 'Цель', required: true, order: 0 },
      { label: 'Образец', required: true, order: 1 },
      { label: 'Метод', required: false, order: 2 },
      { label: 'Выводы', required: false, order: 3 },
    ],
    [{ text: 'Подготовить таблетку KBr', order: 0 }, { text: 'Записать спектр 4000–400 см⁻¹', order: 1 }],
  )

  const methodsFolder = await insertFolder({
    projectId: project.id,
    authorId: ids.bobId,
    title: 'Методики',
    parentId: null,
    sortOrder: 0,
  })

  await insertPage({
    projectId: project.id,
    authorId: ids.bobId,
    title: 'Подготовка образцов',
    parentId: methodsFolder.id,
    sortOrder: 0,
    bodyHtml:
      '<p>Измельчение полимера, смешивание с KBr 1:100, прессование таблетки.</p>',
  })

  await insertExperiment({
    projectId: project.id,
    authorId: ids.bobId,
    templateId: template.id,
    title: 'ИК ПЭТФ — контроль кристалличности',
    status: 'completed_failure',
    fieldDefinitions,
    fieldValues: fieldValuesByLabels(fieldDefinitions, {
      Цель: 'Оценить степень кристалличности после отжига',
      Образец: 'ПЭТФ плёнка, партия #12',
      Метод: 'FTIR, 32 сканирования',
      Выводы: 'Пики кристалличности слабые — образец аморфный, повторить отжиг',
    }),
    checklist: markChecklistDone(buildChecklistFromSeed(template.defaultChecklist as TemplateChecklistItemSeed[]), [0, 1]),
    observationsHtml: '<p>Спектр зашумлён — возможно, пузыри в таблетке.</p>',
    tags: ['ир', 'полимеры'],
    parentNodeId: null,
    sortOrder: 1,
  })

  return project.id
}

async function seedElectrochemistryProject(ids: DemoUserIds) {
  const [project] = await db
    .insert(projects)
    .values({
      name: 'Электрохимия наночастиц',
      description: `Третий проект на dashboard Алисы. ${DEMO_SEED_MARKER}`,
      ownerId: ids.aliceId,
    })
    .returning()

  await db.insert(projectMembers).values([
    { projectId: project.id, userId: ids.aliceId, role: 'owner' },
  ])

  await seedDefaultProjectExperimentTemplate(project.id)

  const fieldDefinitions = assignFieldIds([
    { label: 'Цель', required: true, order: 0 },
    { label: 'Электролит', required: false, order: 1 },
  ])

  await insertPage({
    projectId: project.id,
    authorId: ids.aliceId,
    title: 'План работ на июнь',
    parentId: null,
    sortOrder: 0,
    bodyHtml: '<p>Цикл CV для Au-наночастиц в 0.1 M HClO₄.</p>',
  })

  await insertExperiment({
    projectId: project.id,
    authorId: ids.aliceId,
    templateId: null,
    title: 'CV — золотые наночастицы',
    status: 'draft',
    fieldDefinitions,
    fieldValues: fieldValuesByLabels(fieldDefinitions, {
      Цель: 'Определить потенциал восстановления',
      Электролит: '0.1 M HClO₄, N₂',
    }),
    checklist: [],
    observationsHtml: null,
    tags: ['электрохимия'],
    parentNodeId: null,
    sortOrder: 1,
  })

  return project.id
}

async function seedAliceUserTemplates(aliceId: string) {
  const existing = await db
    .select({ id: experimentTemplates.id })
    .from(experimentTemplates)
    .where(eq(experimentTemplates.userId, aliceId))
    .limit(1)

  if (existing.length > 0)
    return

  await insertUserTemplate(
    aliceId,
    'Быстрый протокол',
    [{ label: 'Цель', required: true, order: 0 }, { label: 'Заметки', required: false, order: 1 }],
    [],
    '<p>Краткая запись для пилотных опытов.</p>',
  )

  await insertUserTemplate(
    aliceId,
    'Полный ELN',
    [
      { label: 'Цель', required: true, order: 0 },
      { label: 'Гипотеза', required: false, order: 1 },
      { label: 'Материалы', required: false, order: 2 },
      { label: 'Протокол', required: false, order: 3 },
      { label: 'Условия', required: false, order: 4 },
      { label: 'Результаты', required: false, order: 5 },
    ],
    [
      { text: 'Подготовить реагенты', order: 0 },
      { text: 'Провести опыт', order: 1 },
      { text: 'Зафиксировать данные', order: 2 },
    ],
    defaultExperimentTemplateSeed.defaultObservations,
  )
}

export async function clearLegacyDemoSeed(aliceId: string) {
  await db.delete(projects).where(
    and(
      eq(projects.ownerId, aliceId),
      eq(projects.description, 'Демо-проект для SHWare'),
    ),
  )
}

export async function clearDemoSeed() {
  await db.delete(projects).where(like(projects.description, `%${DEMO_SEED_MARKER}%`))
}

export async function isDemoSeedApplied(): Promise<boolean> {
  const rows = await db
    .select({ id: projects.id })
    .from(projects)
    .where(like(projects.description, `%${DEMO_SEED_MARKER}%`))
    .limit(1)
  return rows.length > 0
}

export async function runDemoSeed(ids: DemoUserIds) {
  await seedAliceUserTemplates(ids.aliceId)

  const projectIds = await Promise.all([
    seedCatalystsProject(ids),
    seedSpectroscopyProject(ids),
    seedElectrochemistryProject(ids),
  ])

  return { projectIds }
}
