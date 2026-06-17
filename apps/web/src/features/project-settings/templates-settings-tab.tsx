import { useUnit } from 'effector-react'
import { ExperimentTemplateManager } from '@/features/experiment-template-editor'
import { $canEdit, $projectId } from '@/features/project-sidebar/model'

export function TemplatesSettingsTab() {
  const [projectId, canEdit] = useUnit([$projectId, $canEdit])

  if (!projectId)
    return null

  return (
    <ExperimentTemplateManager
      scope="project"
      projectId={projectId}
      canEdit={canEdit}
      title="Шаблоны проекта"
    />
  )
}
