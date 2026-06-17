import type { ProjectSettingsTab } from '@/features/project-settings'
import { useUnit } from 'effector-react'
import { ProjectSettingsPanel } from '@/features/project-settings'
import { ProjectWorkspaceLayout } from '@/layouts/project-workspace'
import { projectQuery } from '@/shared/api'
import { routes } from '@/shared/routing'

export default function ProjectSettingsPage() {
  const [params, project, projectPending] = useUnit([
    routes.projectSettings.$params,
    projectQuery.$data,
    projectQuery.$pending,
  ])

  const loading = projectPending && !project

  return (
    <ProjectWorkspaceLayout settingsActive loading={loading}>
      {project && (
        <ProjectSettingsPanel
          projectId={params.projectId}
          activeTab={params.tab as ProjectSettingsTab}
        />
      )}
    </ProjectWorkspaceLayout>
  )
}
