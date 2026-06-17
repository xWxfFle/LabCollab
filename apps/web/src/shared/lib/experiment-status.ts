import type { ExperimentStatus } from '@labcollab/shared'

export const experimentStatusLabels: Record<ExperimentStatus, string> = {
  draft: 'Черновик',
  in_progress: 'В процессе',
  completed_success: 'Успешно выполнен',
  completed_failure: 'Неуспешно выполнен',
}

/** Короткие подписи для фильтра и бейджей в дереве — из тех же формулировок, что и на странице. */
export const experimentStatusShortLabels: Record<ExperimentStatus, string> = {
  draft: 'Черн.',
  in_progress: 'В проц.',
  completed_success: 'Успех',
  completed_failure: 'Неусп.',
}

export const experimentStatusFilterOptions: Array<{
  value: ExperimentStatus | 'all'
  label: string
}> = [
  { value: 'all', label: 'Все' },
  ...(
    Object.entries(experimentStatusShortLabels) as Array<[ExperimentStatus, string]>
  ).map(([value, label]) => ({ value, label })),
]

export const experimentStatusMeta: Record<
  ExperimentStatus,
  { label: string, color: string }
> = {
  draft: { label: experimentStatusLabels.draft, color: 'gray' },
  in_progress: { label: experimentStatusLabels.in_progress, color: 'violet' },
  completed_success: { label: experimentStatusLabels.completed_success, color: 'green' },
  completed_failure: { label: experimentStatusLabels.completed_failure, color: 'red' },
}
