import type { ExperimentStatus } from '@labcollab/shared'

export const experimentStatusLabels: Record<ExperimentStatus, string> = {
  draft: 'Черновик',
  in_progress: 'В процессе',
  completed: 'Завершён',
}

export const experimentStatusMeta: Record<
  ExperimentStatus,
  { label: string, color: string }
> = {
  draft: { label: experimentStatusLabels.draft, color: 'gray' },
  in_progress: { label: experimentStatusLabels.in_progress, color: 'violet' },
  completed: { label: experimentStatusLabels.completed, color: 'green' },
}
