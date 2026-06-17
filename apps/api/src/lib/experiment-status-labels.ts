import type { ExperimentStatus } from '@labcollab/shared'

export const experimentStatusLabels: Record<ExperimentStatus, string> = {
  draft: 'Черновик',
  in_progress: 'В процессе',
  completed_success: 'Успешно выполнен',
  completed_failure: 'Неуспешно выполнен',
}
